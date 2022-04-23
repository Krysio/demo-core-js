export default class BufferWrapper extends Buffer {
    static create(buffer: Buffer): BufferWrapper {
        if (buffer instanceof BufferWrapper) {
            return buffer;
        }

        return Object.setPrototypeOf(buffer, BufferWrapper.prototype).seek(0);
    }

    protected $cursor = 0;
    public get cursor() {
        return this.$cursor;
    }
    public set cursor(value: number) {
        if (value < 0) {
            this.$cursor = 0;
        } else if (value >= this.length) {
            this.$cursor = this.length - 1;
        } else {
            this.$cursor = value;
        }
    }

    public seek(value: number) {
        this.cursor = value;
        return this;
    }

    readUleb128(format: 'buffer'): Buffer;
    readUleb128(format: 'hex'): string;
    readUleb128(format: 'number'): number;
    readUleb128(): number;
    readUleb128(format: 'buffer' | 'hex' | 'number' = 'number') {
        let length = 0;
        while (this[this.cursor + length] & 0x80) length++;
        length += 1;
        length -= Math.floor(length / 8);

        const result = Buffer.alloc(length, 0);

        for (
            let i = 0, j = this.cursor;
            i < length;
            i++, j++
        ) {
            switch (i % 8) {
                // [ i - 1 ] [ i ]
                case 0: // [-] [0765 4321]
                    result[i] = 0x7f & this[j];
                    break;
                case 1: // [1000 0000] [0076 5432]
                    result[i - 1] |= (0x01 & this[j]) << 7;
                    result[i] = (0x7f & this[j]) >> 1;
                    break;
                case 2: // [2100 0000] [0007 6543]
                    result[i - 1] |= (0x03 & this[j]) << 6;
                    result[i] = (0x7f & this[j]) >> 2;
                    break;
                case 3: // [3210 0000] [0000 7654]
                    result[i - 1] |= (0x07 & this[j]) << 5;
                    result[i] = (0x7f & this[j]) >> 3;
                    break;
                case 4: // [4321 0000] [0000 0765]
                    result[i - 1] |= (0x0f & this[j]) << 4;
                    result[i] = (0x7f & this[j]) >> 4;
                    break;
                case 5: // [5432 1000] [0000 0076]
                    result[i - 1] |= (0x1f & this[j]) << 3;
                    result[i] = (0x7f & this[j]) >> 5;
                    break;
                case 6: // [6543 2100] [0000 0007]
                    result[i - 1] |= (0x3f & this[j]) << 2;
                    result[i] = (0x7f & this[j]) >> 6;
                    break;
                case 7: // [7654 3210] [-]
                    result[i - 1] |= (0x7f & this[j]) << 1;
                    i--;
                    break;
            }
        }

        this.cursor += length;

        switch (format) {
            case 'hex': return result.toString('hex');
            case 'number': return result.readUIntLE(0, result.length);
        }

        return result;
    }

    read(length: number) {
        const result = this.slice(
            this.cursor,
            this.cursor + length
        );

        this.cursor += length;

        return result;
    }

    readUleb128ArrayOfBuffer() {
        const arrayLength = this.readUleb128();
        const result = new Array(arrayLength) as Buffer[];

        for (let i = 0; i < arrayLength; i++) {
            result[i] = this.read(this.readUleb128()) as unknown as Buffer;
        }

        return result;
    }

    static arrayOfBufferToUleb128Buffer(list: Buffer[]) {
        return BufferWrapper.create(Buffer.concat([
            BufferWrapper.numberToUleb128Buffer(list.length),
            ...list.map((item) => Buffer.concat([
                BufferWrapper.numberToUleb128Buffer(item.length),
                item
            ]))
        ]));
    }

    static numberToUleb128Buffer(value: number) {
        if (value < 0) {
            throw new Error('The value must be unsigned');
        }

        const result = [] as number[];
        let currentIndex = 0;
        let currentValue = value;

        if (currentValue) {
            while (currentValue) {
                result[currentIndex] = currentValue & 0x7f;

                if (currentValue <= 0xffffffff) {
                    currentValue = currentValue >>> 7;
                } else {
                    currentValue = Number(BigInt(currentValue) >> BigInt(7));
                }

                if (currentValue) {
                    result[currentIndex] |= 0x80;
                }

                currentIndex++;
            }
        } else {
            result.push(0);
        }

        return BufferWrapper.create(Buffer.from(result));
    }

    /***************************/

    static concat(...args: Parameters<typeof Buffer.concat>) {
        return BufferWrapper.create(
            super.concat(...args)
        );
    }

    static from(arrayBuffer: ArrayBuffer | SharedArrayBuffer, byteOffset?: number, length?: number): BufferWrapper;
    static from(data: number[]): BufferWrapper;
    static from(data: Uint8Array): BufferWrapper;
    static from(obj: { valueOf(): string | object } | { [Symbol.toPrimitive](hint: 'string'): string }, byteOffset?: number, length?: number): BufferWrapper;
    static from(str: string, encoding?: BufferEncoding): BufferWrapper;
    static from(...args: any[]) {
        return BufferWrapper.create(
            //@ts-ignore
            super.from(...args)
        );
    }

    static alloc(...args: Parameters<typeof Buffer.alloc>) {
        return BufferWrapper.create(
            super.alloc(...args)
        );
    }

    public _isBuffer = true;
    static compare(a: BufferWrapper, b: BufferWrapper) {
        return super.compare(a, b);
    }

    slice(...args: Parameters<Buffer['slice']>): BufferWrapper {
        return BufferWrapper.create(
            super.slice(...args)
        );
    }

    public ['toJSON' as 'toJSON-polimorfism-fix']() {
        return `Buff[${this.toString('hex')}]`;
    }
}
