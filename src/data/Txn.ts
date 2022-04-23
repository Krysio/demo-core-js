import BufferWrapper from "@/libs/BufferWrapper";

export default class Txn {
  static fromBuffer(buffer: Buffer) {
    try {
      return new Txn().fromBuffer(buffer);
    } catch (error) {
      return null;
    }
  }

  fromBuffer(buffer: Buffer) {
    const wb = BufferWrapper.create(buffer);

    return this;
  }
}