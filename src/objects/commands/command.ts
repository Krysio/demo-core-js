import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { sha256 } from "@/libs/crypto/sha256";
import Block from "@/objects/block";
import Key from "@/objects/key";
import { getUser } from "@/storage/users";
import { TYPE_USER_VOTER } from "../user";
import chainTop from "@/chaintop";
import config from "@/config";

const VERSION = 1;

/******************************/

const mapOftypes = new Map<number, Function>();
export const Type = (typeID: number) => {
    return (target: new (...args: any[]) => any) => {
        const ref = {[target.prototype.constructor.name]: class extends target {typeID = typeID;} };

        mapOftypes.set(typeID, ref[target.prototype.constructor.name]);
        return ref[target.prototype.constructor.name] as unknown as void;
    }
};

/******************************/

export interface ICommandType {
    fromBufferCommandType(buffer: WBuffer, bufferType: 'block' | 'net'): void;
    toBufferCommandType(bufferType: 'block' | 'net' | 'nosignature'): WBuffer;
    isValidCommandType(): boolean;
    verifyCommandType(): Promise<boolean>;
    setPrevBlockCommandType(block: Block): void;
}

export interface ICommandImplementation {
    fromBufferImplementation(buffer: WBuffer): void;
    toBufferImplementation(): WBuffer;
    isValidImplementation(): boolean;
    verifyImplementation(): Promise<boolean>;
    applyImplementation(): Promise<void>;
}

export class Command {
    version = VERSION;
    typeID: number;

    setType(typeID: number) {
        this.typeID = typeID;

        const Typed = mapOftypes.get(typeID) as typeof Key;

        if (Typed) {
            Object.setPrototypeOf(this, Typed.prototype);
        }
    }

    static fromBuffer(buffer: WBuffer, bufferType: 'block' | 'net' = 'net') {
        try {
            const cursor = buffer.cursor;
            const version = buffer.readUleb128();
            const typeID = buffer.readUleb128();
            const Typed = mapOftypes.get(typeID) as typeof Command;

            if (Typed) {
                buffer.cursor = cursor;
                return new Typed().fromBuffer(buffer, bufferType);
            }
        } catch (error) {
            return null;
        }
    }

    fromBuffer(buffer: WBuffer, bufferType: 'block' | 'net' = 'net'): Command {
        try {
            this.version = buffer.readUleb128();
            this.typeID = buffer.readUleb128();
            (this as unknown as ICommandType).fromBufferCommandType(buffer, bufferType);
            return this;
        } catch (error) {
            return null;
        }
    }

    toBuffer(bufferType: 'block' | 'net' | 'nosignature' = 'net'): WBuffer {
        try {
            const version = bufferType !== 'block' ? WBuffer.uleb128(VERSION) : EMPTY_BUFFER;
            const typeID = WBuffer.uleb128(this.typeID);
            const content = (this as unknown as ICommandType).toBufferCommandType(bufferType);
            
            return WBuffer.concat([
                version,
                typeID,
                content
            ]);
        } catch (error) {
            return null;
        }
    }

    getHash(): WBuffer {
        const buffer = this.toBuffer('nosignature');

        if (!buffer) {
            return null;
        }

        return sha256(buffer);
    }

    setPrevBlock(block: Block) {
        (this as unknown as ICommandType).setPrevBlockCommandType(block);
    }

    isValid() {
        if (this.version !== VERSION) {
            return false;
        }

        if (!mapOftypes.get(this.typeID)) {
            return false;
        }

        return (this as unknown as ICommandType).isValidCommandType();
    }

    verify() {
        if (chainTop.getHeight() % config.spaceBetweenDBSnapshot !== 0) {
            return false;
        }

        return (this as unknown as ICommandType).verifyCommandType();
    }

    apply(): Promise<void> {
        return (this as unknown as ICommandImplementation).applyImplementation();
    }
}

export class CommandTypeInternal extends Command implements ICommandType {
    fromBufferCommandType(buffer: WBuffer): void {
        (this as unknown as ICommandImplementation).fromBufferImplementation(buffer);
    }

    toBufferCommandType(): WBuffer {
        return (this as unknown as ICommandImplementation).toBufferImplementation();
    }

    isValidCommandType(): boolean {
        return (this as unknown as ICommandImplementation).isValidImplementation();
    }

    verifyCommandType(): Promise<boolean> {
        return (this as unknown as ICommandImplementation).verifyImplementation();
    }

    setPrevBlockCommandType() {}
}
// export class CommandTypeAdmin extends Command implements ICommandType {}
// export class CommandTypeUser extends Command implements ICommandType {}
export class CommandTypeMultiUser extends Command implements ICommandType {
    hashOfPrevBlock: WBuffer = null;
    listOfAuthors: WBuffer[] = [];
    listOfSignatures: WBuffer[] = [];

    get countOfAuthors() {
        return this.listOfAuthors.length;
    }

    fromBufferCommandType(buffer: WBuffer, bufferType: 'block' | 'net' | 'nosignature' = 'net'): void {
        this.listOfAuthors = [];
        this.listOfSignatures = [];
        
        if (bufferType !== 'block') {
            this.hashOfPrevBlock = buffer.read(32);
        }

        const countOfAuthors = buffer.readUleb128();

        for (let i = 0; i < countOfAuthors; i++) {
            this.listOfAuthors.push(buffer.read(16));
        }

        (this as unknown as ICommandImplementation).fromBufferImplementation(buffer);

        for (let i = 0; i < countOfAuthors; i++) {
            if (buffer.isCursorAtTheEnd === false) {
                const sizeOfSignature = buffer.readUleb128();
                this.listOfSignatures.push(buffer.read(sizeOfSignature));
            } else {
                this.listOfSignatures.push(null);
            }
        }
    }

    toBufferCommandType(bufferType: 'block' | 'net' | 'nosignature' = 'net'): WBuffer {
        const hashOfPrevBlock = bufferType !== 'block' ? this.hashOfPrevBlock : EMPTY_BUFFER;
        const countOfAuthors = WBuffer.uleb128(this.countOfAuthors);
        const data = (this as unknown as ICommandImplementation).toBufferImplementation();
        const listOfSignatures = bufferType !== 'nosignature'
            ? WBuffer.arrayOfBufferToBuffer(this.listOfSignatures.filter(signature => signature), false)
            : EMPTY_BUFFER;
        
        return WBuffer.concat([
            hashOfPrevBlock,
            countOfAuthors,
            ...this.listOfAuthors,
            data,
            listOfSignatures
        ]);
    }

    addAuthor(userID: WBuffer, signature: WBuffer = null) {
        for (let i = 0; i < this.countOfAuthors; i++) {
            switch (WBuffer.compare(this.listOfAuthors[i], userID)) {
                case 0: {
                    this.listOfSignatures[i] = signature;
                } return;
                case 1: {
                    this.listOfAuthors.splice(i, 0, userID);
                    this.listOfSignatures.splice(i, 0, signature);
                } return;
            }
        }

        this.listOfAuthors.push(userID);
        this.listOfSignatures.push(signature);
    }

    *getSignatureInterator() {
        for (let i = 0; i < this.countOfAuthors; i++) {
            yield {
                userID: this.listOfAuthors[i],
                signature: this.listOfSignatures[i]
            };
        }
    }

    async verifyCommandType(): Promise<boolean> {
        const hash = this.getHash();
        let isInvalid = false;

        for (const { userID, signature } of this.getSignatureInterator()) {
            const user = await getUser(userID);

            if (user.typeID !== TYPE_USER_VOTER) {
                isInvalid = true;
            }

            if (user.key.verify(hash, signature) === false) {
                isInvalid = true;
            }
        }

        return !isInvalid;
    }

    isValidCommandType() {
        if (!this.hashOfPrevBlock) {
            return false;
        }

        return (this as unknown as ICommandImplementation).isValidImplementation();
    }

    setPrevBlockCommandType(block: Block) {
        this.hashOfPrevBlock = block.hashOfPrevBlock;
    }
}
