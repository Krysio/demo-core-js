import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { doubleSha256, sha256 } from "@/libs/crypto/sha256";
import Block from "@/objects/Block";
import Key from "@/objects/key";
import storeUsers from "@/storage/users";
import { TYPE_USER_ADMIN, TYPE_USER_VOTER } from "../user";
import { MapOfEffects } from "@/constants";
import { Node } from '@/main';

const VERSION = 1;

function getUserID(authorTypeID: number, keyOfAuthor: Key): WBuffer {
    if (!keyOfAuthor) return null;
    
    const bufferOfKey = keyOfAuthor.toBuffer();

    if (!bufferOfKey) return null;

    return doubleSha256(WBuffer.concat([
        WBuffer.uleb128(authorTypeID),
        bufferOfKey
    ]));
}

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
    valueCommandType: number;
    fromBufferCommandType(buffer: WBuffer, bufferType: 'block' | 'net'): void;
    toBufferCommandType(bufferType: 'block' | 'net' | 'nosignature'): WBuffer;
    isValidCommandType(node: Node): boolean;
    verifyCommandType(node: Node): Promise<boolean>;
    setBlockCommandType(block: Block): void;
}

export interface ICommandImplementation {
    fromBufferImplementation(buffer: WBuffer): void;
    toBufferImplementation(): WBuffer;
    isValidImplementation(node: Node): boolean;
    verifyImplementation(node: Node): Promise<boolean>;
    getEffectsImplementation(node: Node, refToEffects: MapOfEffects): void;
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

    get value() {
        return (this as unknown as ICommandType).valueCommandType;
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

    setBlock(block: Block) {
        (this as unknown as ICommandType).setBlockCommandType(block);
    }

    isValid(node: Node) {
        if (this.version !== VERSION) {
            return false;
        }

        if (!mapOftypes.get(this.typeID)) {
            return false;
        }

        return (this as unknown as ICommandType).isValidCommandType(node);
    }

    verify(node: Node) {
        return (this as unknown as ICommandType).verifyCommandType(node);
    }

    getEffects(
        node: Node,
        refToEffects: MapOfEffects
    ): void {
        return (this as unknown as ICommandImplementation)
        .getEffectsImplementation(node, refToEffects);
    }
}

export class CommandTypeInternal extends Command implements ICommandType {
    valueCommandType: number = 0

    fromBufferCommandType(buffer: WBuffer): void {
        (this as unknown as ICommandImplementation).fromBufferImplementation(buffer);
    }

    toBufferCommandType(): WBuffer {
        return (this as unknown as ICommandImplementation).toBufferImplementation();
    }

    isValidCommandType(node: Node): boolean {
        return (this as unknown as ICommandImplementation).isValidImplementation(node);
    }

    verifyCommandType(node: Node): Promise<boolean> {
        return (this as unknown as ICommandImplementation).verifyImplementation(node);
    }

    setBlockCommandType() {}
}

export class CommandTypeAdmin extends Command implements ICommandType {
    valueCommandType: number = 0.000001;
    indexOfPrevBlock: number = null;
    keyOfAuthor: Key = null;
    signature: WBuffer = null;

    fromBufferCommandType(buffer: WBuffer, bufferType: "block" | "net"): void {
        if (bufferType !== 'block') {
            this.indexOfPrevBlock = buffer.readUleb128();
        }

        this.keyOfAuthor = Key.fromBuffer(buffer);

        (this as unknown as ICommandImplementation).fromBufferImplementation(buffer);

        if (buffer.isCursorAtTheEnd === false) {
            const sizeOfSignature = buffer.readUleb128();

            this.signature = buffer.read(sizeOfSignature);
        }
    }

    toBufferCommandType(bufferType: "block" | "net" | "nosignature"): WBuffer {
        const indexOfPrevBlock = bufferType !== 'block'
            ? WBuffer.uleb128(this.indexOfPrevBlock)
            : EMPTY_BUFFER;
        const keyOfAuthor = this.keyOfAuthor.toBuffer();
        const data = (this as unknown as ICommandImplementation).toBufferImplementation();
        const sizeOfSignature = bufferType !== 'nosignature'
            ? WBuffer.uleb128(this.signature.length)
            : EMPTY_BUFFER;
        const signature = bufferType !== 'nosignature'
            ? this.signature
            : EMPTY_BUFFER;
        
        return WBuffer.concat([
            indexOfPrevBlock,
            keyOfAuthor,
            data,
            sizeOfSignature,
            signature
        ]);
    }

    isValidCommandType(node: Node): boolean {
        if (!(this.indexOfPrevBlock ?? false)) return false;
        if (!this.keyOfAuthor || !this.keyOfAuthor.isValid()) return false; 
        
        return (this as unknown as ICommandImplementation).isValidImplementation(node);
    }

    async verifyCommandType(): Promise<boolean> {
        if (!this.signature) return false;

        const userID = getUserID(TYPE_USER_ADMIN, this.keyOfAuthor);

        if (!userID) return false;
        if (await !storeUsers.isActive(userID)) return false;
        if (!this.keyOfAuthor.isValidSignatureLength(this.signature.length)) return false;

        const hash = this.getHash();

        if (!this.keyOfAuthor.verify(hash, this.signature)) return false;

        return true;
    }

    setBlockCommandType(block: Block): void {
        this.indexOfPrevBlock = block.index - 1;
    }
}

export class CommandTypeUser extends Command implements ICommandType {
    valueCommandType: number = 1;
    hashOfPrevBlock: WBuffer = null;
    keyOfAuthor: Key = null;
    signature: WBuffer = null;

    fromBufferCommandType(buffer: WBuffer, bufferType: "block" | "net"): void {
        if (bufferType !== 'block') {
            this.hashOfPrevBlock = buffer.read(32);
        }

        this.keyOfAuthor = Key.fromBuffer(buffer);

        (this as unknown as ICommandImplementation).fromBufferImplementation(buffer);

        if (buffer.isCursorAtTheEnd === false) {
            const sizeOfSignature = buffer.readUleb128();

            this.signature = buffer.read(sizeOfSignature);
        }
    }

    toBufferCommandType(bufferType: "block" | "net" | "nosignature"): WBuffer {
        const hashOfPrevBlock = bufferType !== 'block'
            ? this.hashOfPrevBlock
            : EMPTY_BUFFER;
        const keyOfAuthor = this.keyOfAuthor.toBuffer();
        const data = (this as unknown as ICommandImplementation).toBufferImplementation();
        const sizeOfSignature = bufferType !== 'nosignature'
            ? WBuffer.uleb128(this.signature.length)
            : EMPTY_BUFFER;
        const signature = bufferType !== 'nosignature'
            ? this.signature
            : EMPTY_BUFFER;
        
        return WBuffer.concat([
            hashOfPrevBlock,
            keyOfAuthor,
            data,
            sizeOfSignature,
            signature
        ]);
    }

    isValidCommandType(node: Node): boolean {
        if (!this.hashOfPrevBlock) return false;
        if (!this.keyOfAuthor || !this.keyOfAuthor.isValid()) return false; 
        
        return (this as unknown as ICommandImplementation).isValidImplementation(node);
    }

    async verifyCommandType(): Promise<boolean> {
        if (!this.signature) return false;

        const userID = getUserID(TYPE_USER_VOTER, this.keyOfAuthor);

        if (!userID) return false;
        if (await !storeUsers.isActive(userID)) return false;
        if (!this.keyOfAuthor.isValidSignatureLength(this.signature.length)) return false;

        const hash = this.getHash();

        if (!this.keyOfAuthor.verify(hash, this.signature)) return false;

        return true;
    }

    setBlockCommandType(block: Block) {
        this.hashOfPrevBlock = block.hashOfPrevBlock;
    }
}

export class CommandTypeMultiUser extends Command implements ICommandType {
    valueCommandType: number = 1;
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

    addAuthor(publicKey: WBuffer, signature: WBuffer = null) {
        for (let i = 0; i < this.countOfAuthors; i++) {
            switch (WBuffer.compare(this.listOfAuthors[i], publicKey)) {
                case 0: {
                    this.listOfSignatures[i] = signature;
                } return;
                case 1: {
                    this.listOfAuthors.splice(i, 0, publicKey);
                    this.listOfSignatures.splice(i, 0, signature);
                } return;
            }
        }

        this.listOfAuthors.push(publicKey);
        this.listOfSignatures.push(signature);
    }

    *getSignatureInterator() {
        for (let i = 0; i < this.countOfAuthors; i++) {
            yield {
                publicKey: this.listOfAuthors[i],
                signature: this.listOfSignatures[i]
            };
        }
    }

    isValidCommandType(node: Node) {
        if (!this.hashOfPrevBlock) {
            return false;
        }

        return (this as unknown as ICommandImplementation).isValidImplementation(node);
    }

    async verifyCommandType(): Promise<boolean> {
        const hash = this.getHash();
        let isInvalid = false;

        for (const { publicKey, signature } of this.getSignatureInterator()) {
            const key = Key.fromBuffer(publicKey);

            if (key.verify(hash, signature) === false) {
                isInvalid = true;
            }
        }

        return !isInvalid;
    }

    setBlockCommandType(block: Block) {
        this.hashOfPrevBlock = block.hashOfPrevBlock;
    }
}


