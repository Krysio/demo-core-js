import BufferWrapper from "@/libs/BufferWrapper";
import { HashSum } from "@/libs/crypto/sha256";
import Txn from "@/data/Txn";

export default class Block {
  protected version: number;
  protected index: number;
  protected time: number;
  protected previousBlockHash: BufferWrapper;
  protected transactionCount: number = 0;
  protected txns: Txn[] = [];

  /******************************/

  getVersion(): number | undefined { return this.version; }
  setVersion(value: number): this { this.version = value; return this; }

  getIndex(): number | undefined { return this.index; }
  setIndex(value: number): this { this.index = value; return this; }

  getTime(): number | undefined { return this.time; }
  setTime(value: number): this { this.time = value; return this; }

  getPreviousBlockHash(): BufferWrapper | undefined { return this.previousBlockHash; }
  setPreviousBlockHash(value: BufferWrapper): this { this.previousBlockHash = value; return this; }

  getTxnCount(): number | undefined { return this.transactionCount; }

  getHash(): BufferWrapper {
    const version = this.getVersion();
    const index = this.getIndex();
    const time = this.getTime();
    const previousBlockHash = this.getPreviousBlockHash();

    if (version === undefined) return null;
    if (index === undefined) return null;
    if (time === undefined) return null;
    if (previousBlockHash === undefined) return null;
  
    const hash = new HashSum();

    hash.push(BufferWrapper.numberToUleb128Buffer(version));
    hash.push(BufferWrapper.numberToUleb128Buffer(index));
    hash.push(BufferWrapper.numberToUleb128Buffer(time));
    hash.push(previousBlockHash);
    hash.push(BufferWrapper.numberToUleb128Buffer(this.getTxnCount()));

    for (const txn of this.txns) {
      hash.push(txn.toBuffer());
    }

    return BufferWrapper.create(hash.get());
  }

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

    this.version = wb.readUleb128();
    this.index = wb.readUleb128();
    this.time = wb.readUleb128();
    this.previousBlockHash = wb.read(wb.readUleb128());

    const txnCount = wb.readUleb128();

    this.transactionCount = txnCount;

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
