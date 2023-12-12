import WBuffer from "@/libs/WBuffer";
import { isValidPublicKey } from "@/libs/crypto/ec/secp256k1";

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
}

export default class Key {
    typeID: number;
    key: WBuffer;

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
            this.typeID = buffer.readUleb128();
            (this as unknown as IKey).fromBufferImplementation(buffer);
            return this;
        } catch (error) {
            return null;
        }
    }

    toBuffer(): WBuffer {
        try {
            return WBuffer.concat([
                WBuffer.uleb128(this.typeID),
                (this as unknown as IKey).toBufferImplementation()
            ]);
        } catch (error) {
            return null;
        }
    }

    isValid(): boolean {
        if (!mapOftypes.get(this.typeID)) return false;

        return (this as unknown as IKey).isValidImplementation();
    }
}

@Type(TYPE_KEY_Secp256k1)
export class KeySecp256k1 extends Key implements IKey {
    constructor(key?: WBuffer) {
        super();

        if (key) {
            this.key = key;
        }
    }

    fromBufferImplementation(buffer: WBuffer) {
        this.key = buffer.read(33);
    }

    toBufferImplementation(): WBuffer {
        return this.key;
    }

    isValidImplementation(): boolean {
        if (this.key === undefined) return false;

        return isValidPublicKey(this.key);
    }
}
