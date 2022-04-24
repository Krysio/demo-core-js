import BufferWrapper from "@/libs/BufferWrapper";
import { isValidPublicKey } from "@/libs/crypto/ec/secp256k1";
import { Structure } from "./Structure";

/******************************/

export const TYPE_KEY_Secp256k1 = 0;

/******************************/

export default class Key implements Structure<Key> {
    protected values = new Map();

    /******************************/

    getType() {
        const type = this.values.get('type');
        return type !== undefined ? type as number : null;
    }

    setType(type: typeof TYPE_KEY_Secp256k1): KeySecp256k1;
    setType(type: unknown) {
        this.values.set('type', type);
        
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

        this.values.set('type', type);

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
    constructor(buffer?: BufferWrapper) {
        super();

        this.setType(TYPE_KEY_Secp256k1);

        if (buffer) {
            this.setData(buffer);
        }
    }

    /******************************/

    getData() {
        const type = this.values.get('data');
        return type !== undefined ? type as BufferWrapper : null;
    }
    setData(buffer: BufferWrapper) {
        this.values.set('data', buffer);
    }

    /******************************/

    fromBuffer(buffer: BufferWrapper, skipType = false): KeySecp256k1 {
        skipType || this.values.set('type', buffer.readUleb128());
        this.values.set('data', buffer.read(33));
        return this;
    }

    toBuffer(): BufferWrapper {
        const data = this.getData();

        if (data === null) {
            return null;
        }

        return BufferWrapper.concat([
            BufferWrapper.numberToUleb128Buffer(this.getType()),
            data
        ]);
    }

    isValid(): boolean {
        const data = this.getData();
        return data ? isValidPublicKey(data) : false;
    }
}
