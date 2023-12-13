const SymInspect = Symbol.for('nodejs.util.inspect.custom');

type AvailableFormats = 'buffer' | 'hex' | 'number' | 'bigint';

const getBitCount = (n: number) => n.toString(2).length;
const bufferToBigInt = (buffer: Buffer, isUnsigned: boolean) => {
    let value = BigInt(isUnsigned ? buffer.readUintLE(buffer.length - 1, 1) : buffer.readIntLE(buffer.length - 1, 1));

    for (let i = buffer.length - 2; i >= 0; i--) {
        value = value << 8n;
        value |= BigInt(buffer[ i ]);
    }

    return value;
};

export default class WBuffer extends Buffer {
    public _isBuffer = true;

    /* @depracted Use `WBuffer.from(string[, encoding])` instead.*/
    constructor(arg1: string, arg2?: BufferEncoding) {
        super(arg1, arg2);
        throw new Error('use WBuffer.create(buffer)');
    }

    static create(buffer: Buffer | Uint8Array) {
        if (buffer instanceof WBuffer) {
            return buffer;
        }
        Object.setPrototypeOf(buffer, WBuffer.prototype);
        return (buffer as unknown as WBuffer).seek(0);
    }

    protected $cursor = 0;
    protected $isCursorAtTheEnd = false;
    public get cursor() {
        return this.$cursor;
    }
    public set cursor(value: number) {
        this.$isCursorAtTheEnd = false;
        if (value < 0) {
            this.$cursor = 0;
        } else if (value >= this.length) {
            this.$cursor = this.length - 1;
            this.$isCursorAtTheEnd = true;
        } else {
            this.$cursor = value;
        }
    }

    public seek(value: number) {
        this.cursor = value;
        return this;
    }

    public get isCursorAtTheEnd() {
        return this.$isCursorAtTheEnd;
    }

    public readLeb128(format: 'buffer'): WBuffer;
    public readLeb128(format: 'hex'): string;
    public readLeb128(format: 'number'): number;
    public readLeb128(format: 'bigint'): bigint;
    public readLeb128(): number;
	public readLeb128(format: AvailableFormats = 'number') {
        return this.$readLebUleb128(true, format);
    }

    public readUleb128(format: 'buffer'): WBuffer;
    public readUleb128(format: 'hex'): string;
    public readUleb128(format: 'number'): number;
    public readUleb128(format: 'bigint'): bigint;
    public readUleb128(): number;
    public readUleb128(format: AvailableFormats = 'number') {
        return this.$readLebUleb128(false, format);
    }

    private $readLebUleb128(isLeb128: boolean, format: AvailableFormats = 'number') {
        let countOfInputBytes = 0;
        let countOfBits = 0;
        let isNegative = 0;

        while (this[this.cursor + countOfInputBytes] & 0x80) {
            countOfInputBytes++;
            countOfBits+= 7;
        }
        
        countOfInputBytes = Math.min(countOfInputBytes, this.length - this.cursor - 1);

        const lastByte = this[this.cursor + countOfInputBytes];

        countOfBits+= getBitCount(lastByte);
        countOfInputBytes++;

        if (isLeb128) {
            isNegative = lastByte & 0x40;
        }
        
        const result = Buffer.alloc(Math.ceil((countOfBits + 1) / 8), 0);

        for (
            let i = 0, ii = 0, j = this.cursor;
            ii < countOfInputBytes;
            i++, ii++, j++
        ) {
            switch (ii % 8) {
                case 0:
                    result[i] = 0x7f & this[j];
                    break;
                case 1:
                    result[i - 1] |= (0x01 & this[j]) << 7;
                    result[i] = (0x7f & this[j]) >> 1;
                    break;
                case 2:
                    result[i - 1] |= (0x03 & this[j]) << 6;
                    result[i] = (0x7f & this[j]) >> 2;
                    break;
                case 3:
                    result[i - 1] |= (0x07 & this[j]) << 5;
                    result[i] = (0x7f & this[j]) >> 3;
                    break;
                case 4:
                    result[i - 1] |= (0x0f & this[j]) << 4;
                    result[i] = (0x7f & this[j]) >> 4;
                    break;
                case 5:
                    result[i - 1] |= (0x1f & this[j]) << 3;
                    result[i] = (0x7f & this[j]) >> 5;
                    break;
                case 6:
                    result[i - 1] |= (0x3f & this[j]) << 2;
                    result[i] = (0x7f & this[j]) >> 6;
                    break;
                case 7:
                    result[i - 1] |= (0x7f & this[j]) << 1;
                    i--;
                    break;
            }
        }

        this.cursor += countOfInputBytes;

        if (isNegative) {
            result[ result.length - 1 ] |= 0xff << (7 - (result.length % 8));
        }

        switch (format) {
            case 'hex': return result.toString('hex');
            case 'number': {
                if (isNegative) {
                    return result.readIntLE(0, result.length);
                }

                return result.readUIntLE(0, result.length);
            }
            case 'bigint': return bufferToBigInt(result, !isLeb128);
            case 'buffer': return WBuffer.from(result);
        }
    }

    public read(length: number) {
        const result = this.slice(
            this.cursor,
            this.cursor + length
        );

        this.cursor += length;

        return result;
    }

    public readArrayOfUleb128() {
        const arrayLength = this.readUleb128();
        const result = new Array(arrayLength) as WBuffer[];

        for (let i = 0; i < arrayLength; i++) {
            result[i] = this.read(this.readUleb128());
        }

        return result;
    }

    public static arrayOfUnsignetToBuffer(list: number[], insertArraySize = true) {
        return WBuffer.create(Buffer.concat([
            insertArraySize ? WBuffer.uleb128(list.length) : EMPTY_BUFFER,
            ...list.map((item) => WBuffer.uleb128(item))
        ]));
    }

    public static arrayOfBufferToBuffer(list: WBuffer[], insertArraySize = true) {
        return WBuffer.create(Buffer.concat([
            insertArraySize ? WBuffer.uleb128(list.length) : EMPTY_BUFFER,
            ...list.map((item) => WBuffer.concat([
                WBuffer.numberToUleb128Buffer(item.length),
                item
            ]))
        ]));
    }

    public static numberToLeb128Buffer(value: number | bigint) {
        const result = [] as number[];

        if (typeof value === 'bigint') {
            while (true) {
                const byte = Number(value & 0x7fn);

                value = value >> 7n;

                if ((value == 0n && (byte & 0x40) == 0) || (value == -1n && (byte & 0x40) != 0)) {
                    result.push(byte);

                    return WBuffer.from(result);
                }

                result.push(0x80 | byte)
            }
        } else {
            while (true) {
                const byte = value & 0x7f;

                value = value >> 7;

                if ((value == 0 && (byte & 0x40) == 0) || (value == -1 && (byte & 0x40) != 0)) {
                    result.push(byte);

                    return WBuffer.from(result);
                }

                result.push(0x80 | byte)
            }
        }
    }

    public static leb128(value: number | bigint) {
        return WBuffer.numberToLeb128Buffer(value);
    }

    public static numberToUleb128Buffer(value: number | bigint) {
        if (value < 0) {
            throw new Error('The value must be unsigned');
        }

        const result = [] as number[];
        let currentIndex = 0;

        if (value) {
            if (typeof value === 'bigint') {
                let currentValue = value;

                while (currentValue !== 0n) {
                    result[currentIndex] = Number(currentValue & 0x7fn);
    
                    currentValue = currentValue >> 7n;
    
                    if (currentValue) {
                        result[currentIndex] |= 0x80;
                    }
    
                    currentIndex++;
                }
            } else {
                let currentValue = value;

                while (currentValue) {
                    result[currentIndex] = currentValue & 0x7f;
    
                    currentValue = currentValue >>> 7;
    
                    if (currentValue) {
                        result[currentIndex] |= 0x80;
                    }
    
                    currentIndex++;
                }
            }
        } else {
            result.push(0);
        }

        return WBuffer.from(result);
    }

    public static uleb128(value: number | bigint) {
        return WBuffer.numberToUleb128Buffer(value);
    }

    /***************************/

    public static concat(...args: Parameters<typeof Buffer.concat>) {
        return WBuffer.create(
            super.concat(...args)
        );
    }

    public static from(arrayBuffer: ArrayBuffer | SharedArrayBuffer, byteOffset?: number, length?: number): WBuffer;
    public static from(data: number[]): WBuffer;
    public static from(data: Uint8Array): WBuffer;
    public static from(obj: { valueOf(): string | object } | { [Symbol.toPrimitive](hint: 'string'): string }, byteOffset?: number, length?: number): WBuffer;
    public static from(str: string, encoding?: BufferEncoding): WBuffer;
    public static from(...args: any[]) {
        return WBuffer.create(
            //@ts-ignore
            super.from(...args)
        );
    }

    public static alloc(...args: Parameters<typeof Buffer.alloc>) {
        return WBuffer.create(
            super.alloc(...args)
        );
    }

    public static compare(a: WBuffer, b: WBuffer) {
        return super.compare(a, b);
    }
    public static isEqual(a: WBuffer, b: WBuffer) {
        return super.compare(a, b) === 0;
    }
    public isEqual(b: WBuffer) {
        return WBuffer.compare(this, b) === 0;
    }

    //@ts-ignore rewrite
    public slice(start?: number, end?: number): WBuffer {
        return WBuffer.create(
            Uint8Array.prototype.slice.call(this, start, end)
        );
    }

    //@ts-ignore rewrite
    public subarray(...args: Parameters<typeof Buffer.subarray>) {
        return WBuffer.create(
            super.subarray(...args)
        );
    }

    public inspect() {
        return `<WB:${this.length}:${this.toString('hex')}:${this.cursor}>`;
    }
    //@ts-ignore rewrite
    public toJSON() {
        return this.inspect();
    }
    public [SymInspect]() {
        return this.inspect();
    }

    public hex() {
        return this.toString('hex');
    }
    public static hex(arg: TemplateStringsArray): WBuffer; // WBuffer.hex`00` == WBuffer.from('00', 'hex')
    public static hex(buffer: Buffer | Uint8Array): string;
    public static hex(buffer: any) {
        if (Array.isArray(buffer) && 'raw' in buffer && Array.isArray(buffer.raw)) {
            return WBuffer.from(buffer[0], 'hex');
        }
        return WBuffer.from(buffer).toString('hex');
    }

    public clone() {
        return WBuffer.from(this);
    }
}

export const EMPTY_BUFFER = WBuffer.from([]);
