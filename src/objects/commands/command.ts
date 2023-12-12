import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { EMPTY_HASH, HashSum } from "@/libs/crypto/sha256";

const VERSION = 1;

/******************************/

const mapOftypes = new Map<number, Function>();
export const Type = (typeID: number) => {
    return (target: new () => any) => {
        const ref = {[target.prototype.constructor.name]: class extends target {typeID = typeID;} };

        mapOftypes.set(typeID, ref[target.prototype.constructor.name]);
        return ref[target.prototype.constructor.name] as unknown as void;
    }
};

/******************************/

export interface ICommandType {
    fromBufferCommandType(buffer: WBuffer, bufferType: 'block' | 'net'): void;
    toBufferCommandType(bufferType: 'block' | 'net'): WBuffer;
    isValidCommandType(): Boolean;
}

export interface ICommandImplementation {
    fromBufferImplementation(buffer: WBuffer): void;
    toBufferImplementation(): WBuffer;
    isValidImplementation(): Boolean;
}

export class Command {
    version = VERSION;
    typeID: number;
    hash: WBuffer = EMPTY_HASH;
    isHashDirty = true;

    static fromBuffer(buffer: WBuffer, bufferType: 'block' | 'net' = 'net') {
        try {
            const cursor = buffer.cursor;
            const typeID = buffer.readUleb128();
            const Typed = mapOftypes.get(typeID) as typeof Command;

            if (Typed) {
                buffer.cursor = cursor;
                return new Typed().fromBuffer(buffer);
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

    toBuffer(bufferType: 'block' | 'net' = 'net'): WBuffer {
        try {
            return WBuffer.concat([
                WBuffer.uleb128(VERSION),
                WBuffer.uleb128(this.typeID),
                (this as unknown as ICommandType).toBufferCommandType(bufferType)
            ]);
        } catch (error) {
            return null;
        }
    }

    getHash(): WBuffer {
        if (this.isHashDirty === false) {
            return this.hash;
        }

        const buffer = this.toBuffer('net');

        if (!buffer) {
            return null;
        }

        const hasher = new HashSum();

        hasher.push(buffer);

        this.isHashDirty = false;
        this.hash = hasher.get();

        return this.hash;
    }

    isValid() {
        if (this.version !== VERSION) return false;
        if (!mapOftypes.get(this.typeID)) return false;
        return (this as unknown as ICommandType).isValidCommandType();
    }
}

// export class CommandTypeInternal extends Command implements ICommandType {}
// export class CommandTypeAdmin extends Command implements ICommandType {}
// export class CommandTypeUser extends Command implements ICommandType {}
export class CommandTypeMultiUser extends Command implements ICommandType {
    hashOfPrevBlock: WBuffer = null;
    listOfAuthors: WBuffer[] = [];
    listOfSignatures: WBuffer[] = [];

    get countOfAuthors() {
        return this.listOfAuthors.length;
    }

    fromBufferCommandType(buffer: WBuffer, bufferType: 'block' | 'net' = 'net'): void {
        this.listOfAuthors = [];
        this.listOfSignatures = [];
        
        if (bufferType === 'net') {
            this.hashOfPrevBlock = buffer.read(32);
        }

        const countOfAuthors = buffer.readUleb128();

        for (let i = 0; i < countOfAuthors; i++) {
            this.listOfAuthors.push(buffer.read(32));
        }

        (this as unknown as ICommandImplementation).fromBufferImplementation(buffer);

        for (let i = 0; i < countOfAuthors; i++) {
            if (buffer.isCursorAtTheEnd() === false) {
                const sizeOfSignature = buffer.readUleb128();
                this.listOfSignatures.push(buffer.read(sizeOfSignature));
            } else {
                this.listOfSignatures.push(null);
            }
        }
    }

    toBufferCommandType(bufferType: 'block' | 'net' = 'net'): WBuffer {
        return WBuffer.concat([
            bufferType === 'net' ? this.hashOfPrevBlock : EMPTY_BUFFER,
            WBuffer.uleb128(this.countOfAuthors),
            ...this.listOfAuthors,
            (this as unknown as ICommandImplementation).toBufferImplementation(),
            WBuffer.arrayOfBufferToBuffer(this.listOfSignatures.filter(signature => signature), false)
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
                    this.isHashDirty = true;
                } return;
            }
        }

        this.listOfAuthors.push(userID);
        this.listOfSignatures.push(signature);
        this.isHashDirty = true;
    }

    *getSignatureInterator() {
        for (let i = 0; i < this.countOfAuthors; i++) {
            yield { userID: this.listOfAuthors[i], signature: this.listOfSignatures[i] };
        }
    }

    isValidCommandType() {
        if (!this.hashOfPrevBlock) return false;
        return (this as unknown as ICommandImplementation).isValidImplementation();
    }
}
