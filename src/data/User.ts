import BufferWrapper from "@/libs/BufferWrapper";
import Key from "@/data/Key";
import { Structure } from "@/data/Structure";

/******************************/

export const TYPE_USER_ROOT = 0;
export const TYPE_USER_ADMIN = 1;
export const TYPE_USER_USER = 2;
export const TYPE_USER_PUBLIC = 3;

/******************************/

export default class User implements Structure<User> {
    protected type: number;

    /******************************/

    getType(): number | undefined { return this.type; }
    setType(type: typeof TYPE_USER_ROOT): UserRoot;
    setType(type: number) {
        this.type = type;

        switch (type) {
            case TYPE_USER_ROOT: return Object.setPrototypeOf(this, UserRoot.prototype);
        }

        return null;
    }

    /******************************/

    static fromBuffer(buffer: BufferWrapper) {
        try {
            return new User().fromBuffer(buffer);
        } catch (error) {
            return null;
        }
    }

    fromBuffer(buffer: BufferWrapper): User {
        const type = buffer.readUleb128();

        this.type = type;

        switch (type) {
            case TYPE_USER_ROOT: return Object.setPrototypeOf(UserRoot.prototype, this).fromBuffer(buffer, true);
        }

        return null;
    }

    // abstract
    toBuffer() { return null as BufferWrapper; };
    // abstract
    isValid() { return false; }
}

export class UserRoot extends User {
    protected key: Key;

    /******************************/

    getKey(): Key | undefined { return this.key; }
    setKey(key: Key) { this.key = key; return this; }

    /******************************/

    fromBuffer(buffer: BufferWrapper, skipType = false): UserRoot {
        skipType || (this.type = buffer.readUleb128());
        this.key = Key.fromBuffer(buffer);

        return this;
    }

    toBuffer(): BufferWrapper {
        const type = this.getType();
        const key = this.getKey();

        if (type === undefined) return null;
        if (key === undefined) return null;

        const keyBuffer = key.toBuffer();

        if (keyBuffer === null) return null;

        return BufferWrapper.concat([
            BufferWrapper.numberToUleb128Buffer(type),
            keyBuffer
        ]);
    }

    isValid(): boolean {
        const type = this.getType();
        const key = this.getKey();

        if (type === undefined) return false;
        if (key === undefined) return false;

        return key.isValid();
    }
}
