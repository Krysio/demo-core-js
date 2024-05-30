import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Key } from "@/objects/key";

export class Anonim {
    publicKey: Key;
    level: number = 0;

    constructor(
        publicKey?: Key
    ) {
        if (publicKey) {
            this.publicKey = publicKey;
        }
    }

    static parse(buffer: WBuffer) {
        return new Anonim().parse(buffer);
    }

    parse(
        buffer: WBuffer,
        source: 'db' | 'net' = 'net'
    ) {
        try {
            if (source !== 'db') {
                this.publicKey = Key.parse(buffer);
            }
    
            this.level = buffer.readUleb128();

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

            const level = WBuffer.uleb128(this.level);

            return WBuffer.concat([
                publicKey,
                level
            ]);
        } catch (error) {
            return null;
        }
    }

    public inspect() {
        return `<${this.constructor.name}:${JSON.stringify({
            publicKey: this.publicKey,
            level: this.level,
        }, null, '  ')}>`;
    }
    public toJSON() {
        return this.inspect();
    }
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.inspect();
    }
}
