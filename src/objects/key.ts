import WBuffer from "@/libs/WBuffer";
import {
    isValidPublicKey as isValidPublicKeySecp256k1,
    sign as signSecp256k1,
    verify as verifySecp256k1,
    encryptAES256GCM as encryptSecp256k1,
    decryptAES256GCM as decryptSecp256k1
} from "@/libs/crypto/ec/secp256k1";

const SymInspect = Symbol.for('nodejs.util.inspect.custom');

export const ERROR_NO_PRIVATE_KEY = 'No private key';

/******************************/

export const TYPE_KEY_Secp256k1 = 0;

const mapOftypes = new Map<number, Function>();
export const Type = (typeID: number) => {
    return (target: new (...args: any[]) => any) => {
        const ref = {[target.prototype.constructor.name]: class extends target {
            typeID = typeID;
            constructor(...args: any[]) {
                super(...args);
            }
        }};

        mapOftypes.set(typeID, ref[target.prototype.constructor.name]);
        return ref[target.prototype.constructor.name] as unknown as void;
    }
};

/******************************/

interface IKey {
    fromBufferImplementation(buffer: WBuffer): void;
    toBufferImplementation(): WBuffer;
    isValidImplementation(): boolean;
    signImplementation(hash: WBuffer, privateKey?: WBuffer): WBuffer;
    verifyImplementation(hash: WBuffer, signature: WBuffer): boolean;
    encryptImplementation(message: WBuffer): WBuffer;
    decryptImplementation(message: WBuffer, privateKey?: WBuffer): WBuffer;
}

export default class Key {
    typeID: number;
    key: WBuffer;
    privateKey: WBuffer = null;
    buffer: WBuffer;
    isBufferDirty = true;

    constructor(
        publicKey?: WBuffer,
        privateKey?: WBuffer
    ) {
        this.key = publicKey || null;
        this.privateKey = privateKey || null;
    }

    //#region buffer

    static fromBuffer(buffer: WBuffer) {
        try {
            const cursor = buffer.cursor;
            const typeID = buffer.readUleb128();
            const Typed = mapOftypes.get(typeID) as typeof Key;

            if (Typed) {
                buffer.cursor = cursor;
                return new Typed().fromBuffer(buffer);
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    fromBuffer(buffer: WBuffer): Key {
        try {
            const cursorStart = buffer.cursor;

            this.typeID = buffer.readUleb128();
            (this as unknown as IKey).fromBufferImplementation(buffer);
            this.buffer = buffer.subarray(cursorStart, buffer.cursor);
            this.isBufferDirty = false;

            return this;
        } catch (error) {
            return null;
        }
    }

    toBuffer(): WBuffer {
        if (this.isBufferDirty = false) {
            return this.buffer;
        }

        try {
            return WBuffer.concat([
                WBuffer.uleb128(this.typeID),
                (this as unknown as IKey).toBufferImplementation()
            ]);
        } catch (error) {
            return null;
        }
    }

    //#endregion buffer

    isValid(): boolean {
        if (!mapOftypes.get(this.typeID)) return false;
        if (!this.key) return false;

        return (this as unknown as IKey).isValidImplementation();
    }

    isEqual(key: Key) {
        if (this.typeID !== key.typeID) return false;
        if (!this.key.isEqual(key.key)) return false;
        return true;
    }

    //#region crypto

    sign(hash: WBuffer, privateKey?: WBuffer) {
        return (this as unknown as IKey).signImplementation(hash, privateKey);
    }
    verify(hash: WBuffer, signature: WBuffer) {
        return (this as unknown as IKey).verifyImplementation(hash, signature);
    }
    encrypt(message: WBuffer) {
        return (this as unknown as IKey).encryptImplementation(message);
    }
    decrypt(message: WBuffer, privateKey?: WBuffer) {
        return (this as unknown as IKey).decryptImplementation(message, privateKey);
    }

    //#endregion crypto

    public inspect() {
        return `<${this.constructor.name}:${WBuffer.hex(this.key)}>`;
    }
    public toJSON() {
        return this.inspect();
    }
    [SymInspect]() {
        return this.inspect();
    }
}

@Type(TYPE_KEY_Secp256k1)
export class KeySecp256k1 extends Key implements IKey {
    fromBufferImplementation(buffer: WBuffer) {
        this.key = buffer.read(33);
    }

    toBufferImplementation(): WBuffer {
        return this.key;
    }

    isValidImplementation(): boolean {
        return isValidPublicKeySecp256k1(this.key);
    }

    //#region crypto
    
    signImplementation(hash: WBuffer, privateKey?: WBuffer): WBuffer {
        const key = privateKey || this.privateKey;

        if (!key) throw new Error(ERROR_NO_PRIVATE_KEY);

        return signSecp256k1(
            key,
            hash
        );
    }
    verifyImplementation(hash: WBuffer, signature: WBuffer): boolean {
        return verifySecp256k1(
            this.key,
            hash,
            signature
        );
    }
    encryptImplementation(message: WBuffer): WBuffer {
        return encryptSecp256k1(
            this.key,
            message
        );
    }
    decryptImplementation(message: WBuffer, privateKey?: WBuffer): WBuffer {
        const key = privateKey || this.privateKey;

        if (!key) throw new Error(ERROR_NO_PRIVATE_KEY);

        return decryptSecp256k1(
            key,
            message
        );
    }

    //#endregion crypto
}
