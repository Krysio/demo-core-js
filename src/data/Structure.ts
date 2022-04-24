import BufferWrapper from "@/libs/BufferWrapper";

export interface Structure<T> {
    fromBuffer(buffer: BufferWrapper): T;
    toBuffer(): BufferWrapper;
    isValid(): boolean;
}
