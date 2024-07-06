import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { BHTime } from "@/modules/time";
import { Key } from "@/objects/key";

export class User {
    public publicKey: Key;
    public parentPublicKey: Key = null;
    public timeStart = 0 as BHTime;
    public timeEnd = 0 as BHTime;
    public flags = 0;
    public metaData: string = '';

    constructor(
        publicKey?: Key,
        metaData?: string
    ) {
        if (publicKey) this.publicKey = publicKey;
        if (metaData) this.metaData = metaData;
    }


    //#region buffer

    public static parse(
        buffer: WBuffer,
        source: 'db' | 'net' = 'net'
    ) {
        return new User().parse(buffer, source);
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
    
            this.timeStart = buffer.readUleb128() as BHTime;
            this.timeEnd = buffer.readUleb128() as BHTime;
            this.metaData = buffer.read(buffer.readUleb128()).utf8();

            return this;
        } catch (error) {
            return null;
        }
    }

    public toBuffer(target: 'db' | 'net' = 'net'): WBuffer {
        // Helper
        if (target === 'db' && !this.parentPublicKey) {
            throw new Error('User: parentPublicKey is null');
        }

        try {
            const publicKey = target !== 'db'
                ? this.publicKey.toBuffer()
                : EMPTY_BUFFER;
            const parentPublicKey = target !== 'net'
                ? this.parentPublicKey.toBuffer()
                : EMPTY_BUFFER;

            const timeStart = WBuffer.uleb128(this.timeStart);
            const timeEnd = WBuffer.uleb128(this.timeEnd);
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

    //#endregion buffer
    //#region inspect

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

    //#endregion inspect
}
