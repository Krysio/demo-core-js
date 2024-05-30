import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Key } from "@/objects/key";

export class Admin {
    publicKey: Key;
    parentPublicKey: Key = null;
    level: number = 0;
    metaData: string = '';

    constructor(
        publicKey?: Key,
        metaData?: string
    ) {
        if (publicKey) this.publicKey = publicKey;
        if (metaData) this.metaData = metaData;
    }

    static parse(
        buffer: WBuffer,
        source: 'db' | 'net' = 'net'
    ) {
        return new Admin().parse(buffer, source);
    }

    public parse(
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
    
            this.level = buffer.readUleb128();
            this.metaData = buffer.read(buffer.readUleb128()).utf8();

            return this;
        } catch (error) {
            return null;
        }
    }

    public toBuffer(target: 'db' | 'net' = 'net'): WBuffer {
        try {
            const publicKey = target !== 'db'
                ? this.publicKey.toBuffer()
                : EMPTY_BUFFER;
            const parentPublicKey = target !== 'net'
                ? this.parentPublicKey.toBuffer()
                : EMPTY_BUFFER;

            const level = WBuffer.uleb128(this.level);
            const sizeOfMeta = WBuffer.uleb128(this.metaData.length);
            const metaData = WBuffer.from(this.metaData, 'utf8');

            return WBuffer.concat([
                publicKey,
                parentPublicKey,
                level,
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
            level: this.level,
            metaData: this.metaData,
        }, null, '  ')}>`;
    }
    public toJSON() {
        return this.inspect();
    }
    public [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.inspect();
    }
}
