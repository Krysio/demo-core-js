import BufferWrapper from "@/libs/BufferWrapper";
import { isValidPublicKey } from "@/libs/crypto/ec/secp256k1";
import { Structure } from "@/data/Structure";

/******************************/

export const TYPE_KEY_Secp256k1 = 0;

/******************************/

export default class Key implements Structure<Key> {
    protected type: number;

    /******************************/

    getType(): number | undefined { return this.type; }
    setType(type: typeof TYPE_KEY_Secp256k1): KeySecp256k1;
    setType(type: number) {
        this.type = type;

        switch (type) {
            case TYPE_KEY_Secp256k1: return Object.setPrototypeOf(this, KeySecp256k1.prototype);
        }

        return null;
    }

    /******************************/

    static fromBuffer(buffer: BufferWrapper) {
        try {
            return new Key().fromBuffer(buffer);
        } catch (error) {
            return null;
        }
    }

    fromBuffer(buffer: BufferWrapper): Key {
        const type = buffer.readUleb128();

        this.type = type;

        switch (type) {
            case TYPE_KEY_Secp256k1: return Object.setPrototypeOf(KeySecp256k1.prototype, this).fromBuffer(buffer, true);
        }

        return null;
    }

    // abstract
    toBuffer() { return null as BufferWrapper; };
    // abstract
    isValid() { return false; };
}

export class KeySecp256k1 extends Key {
    protected data: BufferWrapper;

    /******************************/

    constructor(buffer?: BufferWrapper) {
        super();

        this.setType(TYPE_KEY_Secp256k1);

        if (buffer) {
            this.setData(buffer);
        }
    }

    /******************************/

    getData(): BufferWrapper | null { return this.data;}
    setData(value: BufferWrapper) { this.data = value; return this; }

    /******************************/

    fromBuffer(buffer: BufferWrapper, skipType = false): KeySecp256k1 {
        skipType || (this.type = buffer.readUleb128());
        this.data = buffer.read(33);

        return this;
    }

    toBuffer(): BufferWrapper {
        const type = this.getType();
        const data = this.getData();

        if (type === undefined) return null;
        if (data === undefined) return null;

        return BufferWrapper.concat([
            BufferWrapper.numberToUleb128Buffer(type),
            data
        ]);
    }

    isValid(): boolean {
        const type = this.getType();
        const data = this.getData();
        
        if (type === undefined) return false;
        if (data === undefined) return false;

        return isValidPublicKey(data);
    }
}
