import BufferWrapper from "./BufferWrapper";
import { randomData } from "@/tests/helper";

test('uleb128', () => {
    for (let value of [607]) {
        const buffer = BufferWrapper.numberToUleb128Buffer(value);
        const result = buffer.seek(0).readUleb128();

        expect(result).toBe(value);
    }

    for (let i = 0; i < 1000; i++) {
        const value = parseInt((Math.random() * 1000000).toString());
        const buffer = BufferWrapper.numberToUleb128Buffer(value);
        const result = buffer.seek(0).readUleb128();

        expect(result).toBe(value);
    }
});

test('cursor', () => {
    const values = [] as number[];

    for (let i = 0; i < 10; i++) {
        values.push(parseInt((Math.random() * 1000000).toString()));
    }

    const buffer = BufferWrapper.concat(
        values.map((item) => BufferWrapper.numberToUleb128Buffer(item))
    );

    const result = values.map(() => buffer.readUleb128());

    expect(result).toEqual(values);
});

test('ulebSize, <ulebLength, buffer>[]', () => {
    for (let i = 0; i < 100; i++) {
        const value = [randomData(), randomData(), randomData()];

        const inputBuffer = BufferWrapper.arrayOfBufferToUleb128Buffer(value);

        //console.log(inputBuffer.toString('hex'));
        const result = inputBuffer.readUleb128ArrayOfBuffer();

        expect(Buffer.compare(result[0], value[0])).toBe(0);
        expect(Buffer.compare(result[1], value[1])).toBe(0);
        expect(Buffer.compare(result[2], value[2])).toBe(0);
    }
});