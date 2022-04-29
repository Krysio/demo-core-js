import BufferWrapper from "@/libs/BufferWrapper";
import User from "@/data/User";
import { Structure } from "@/data/Structure";

export const TYPE_TXN_INSERT_ROOT_USER = 1;
export const TYPE_TXN_SET_CONFIG = 2;
export const TYPE_TXN_HASH_LIST = 3;

export default class Txn implements Structure<Txn> {
  protected values = new Map();

  /******************************/

  static fromBuffer(buffer: BufferWrapper) {
    try {
      return new Txn().fromBuffer(buffer);
    } catch (error) {
      return null;
    }
  }

  fromBuffer(buffer: BufferWrapper): Txn {
    const type = buffer.readUleb128();

    this.values.set('type', type);

    switch (type) {
      case TYPE_TXN_INSERT_ROOT_USER: return Object.setPrototypeOf(TxnInsertRootUser.prototype, this).fromBuffer(buffer, true);
    }

    return null;
  }

    // abstract
    toBuffer() { return null as BufferWrapper; };
    // abstract
    isValid() { return false; };
}

class TxnInsertRootUser extends Txn {
  fromBuffer(buffer: BufferWrapper, skipType = false): TxnInsertRootUser {
    skipType || this.values.set('type', buffer.readUleb128());
    this.values.set('data', User.fromBuffer(buffer));

    return this;
  }
}
