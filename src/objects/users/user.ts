import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import Key from "@/objects/key";

export class User {
    publicKey: Key;
    parentPublicKey: Key = null;
    timeStart: number = 0;
    timeEnd: number = 0;
    metaData: string = '';

    constructor(
        publicKey?: Key
    ) {
        if (publicKey) {
            this.publicKey = publicKey;
        }
    }

    static parse(buffer: WBuffer) {
        return new User().parse(buffer);
    }

    parse(
        buffer: WBuffer,
        source: 'db' | 'net' = 'net'
    ) {
        try {
            if (source !== 'db') {
                this.publicKey = Key.parse(buffer);
            }
            if (source !== 'net') {
                this.parentPublicKey = Key.parse(buffer);
            }
    
            this.timeStart = buffer.readUleb128();
            this.timeEnd = buffer.readUleb128();
            this.metaData = buffer.read(buffer.readUleb128()).utf8();

            return this;
        } catch (error) {
            return null;
        }
    }

    toBuffer(target: 'db' | 'net' = 'net'): WBuffer {
        try {
            const publicKey = target !== 'db'
                ? this.publicKey.toBuffer()
                : EMPTY_BUFFER;
            const parentPublicKey = target !== 'net'
                ? this.parentPublicKey.toBuffer()
                : EMPTY_BUFFER;

            const timeStart = WBuffer.uleb128(this.timeStart);
            const timeEnd = WBuffer.uleb128(this.timeStart);
            const sizeOfMeta = WBuffer.uleb128(this.metaData.length);
            const metaData = WBuffer.from(this.metaData, 'utf8');

            return WBuffer.concat([
                publicKey,
                parentPublicKey,
                timeStart,
                timeEnd,
                sizeOfMeta,
                metaData
            ]);
        } catch (error) {
            return null;
        }
    }

    public inspect() {
        return `<${this.constructor.name}:${JSON.stringify({
            publicKey: this.publicKey,
            parentPublicKey: this.parentPublicKey,
            timeStart: this.timeStart,
            timeEnd: this.timeEnd,
            metaData: this.metaData,
        }, null, '  ')}>`;
    }
    public toJSON() {
        return this.inspect();
    }
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.inspect();
    }
}
