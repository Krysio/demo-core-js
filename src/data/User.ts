import BufferWrapper from "@/libs/BufferWrapper";
import Key from "@/data/Key";
import { Structure } from "./Structure";

/******************************/

export const TYPE_USER_ROOT = 0;
export const TYPE_USER_ADMIN = 1;
export const TYPE_USER_USER = 2;
export const TYPE_USER_PUBLIC = 3;

/******************************/

export default class User implements Structure<User> {
  protected values = new Map();

  /******************************/

  getType() {
    const type = this.values.get('type');
    return type !== undefined ? type as number : null;
  }

  setType(type: typeof TYPE_USER_ROOT): UserRoot;
  setType(type: unknown) {
    this.values.set('type', type);

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

    this.values.set('type', type);

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
  getKey(): Key {
    const key = this.values.get('key');
    return key !== undefined ? key : null;
  }
  setKey(key: Key) {
    this.values.set('key', key);
    return this;
  }

  /******************************/

  fromBuffer(buffer: BufferWrapper, skipType = false): UserRoot {
    skipType || this.values.set('type', buffer.readUleb128());
    this.values.set('key', Key.fromBuffer(buffer));

    return this;
  }
  
  toBuffer(): BufferWrapper {
    const key = this.getKey();

    if (key === null) {
        return null;
    }

    const keyBuffer = key.toBuffer();
    
    if (keyBuffer === null) {
      return null;
    }

    return BufferWrapper.concat([
        BufferWrapper.numberToUleb128Buffer(this.getType()),
        keyBuffer
    ]);
}

  isValid(): boolean {
      const key = this.getKey();

      if (key === null || !key.isValid()) {
        return false;
      }

      return true;
  }
}
