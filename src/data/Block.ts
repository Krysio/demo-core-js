import BufferWrapper from "@/libs/BufferWrapper";
import Txn from "@/data/Txn";

export default class Block {
  protected values = new Map();
  protected txns: Txn[] = [];

  /******************************/

  static fromBuffer(buffer: Buffer) {
    try {
      return new Block().fromBuffer(buffer);
    } catch (error) {
      return null;
    }
  }

  fromBuffer(buffer: Buffer) {
    const wb = BufferWrapper.create(buffer);

    this.values.set('version', wb.readUleb128());
    this.values.set('index', wb.readUleb128());
    this.values.set('time', wb.readUleb128());
    this.values.set('previousBlockHash', wb.read(wb.readUleb128()));

    const txnCount = wb.readUleb128();

    this.values.set('transactionCount', txnCount);

    for (let i = 0; i < txnCount; i++) {
      const txn = Txn.fromBuffer(wb);

      if (txn === null) {
        return null;
      }

      this.txns.push(txn);
    }

    return this;
  }
}
