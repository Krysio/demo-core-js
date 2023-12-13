import { createHash } from 'crypto';
import WBuffer from '../WBuffer';

/******************************/

export function sha256(input: string | Buffer | Uint8Array): WBuffer;
export function sha256(input: string | Buffer | Uint8Array, encoding: 'hex' | 'base64'): string;
export function sha256(
    input: string | WBuffer | Buffer | Uint8Array,
    encoding?: 'hex' | 'base64'
): string | WBuffer {
    let hash
    if (typeof input === 'string') {
        hash = createHash('SHA256').update(input, 'utf8');
    } else {
        hash = createHash('SHA256').update(input);
    }

    const result = hash.digest(encoding);

    if (typeof result === 'string') {
        return result;
    } else {
        return WBuffer.create(result);
    }
}

export function doubleSha256(
    input: string | Buffer | Uint8Array,
    encoding: 'hex' | 'base64' = 'hex'
): string | WBuffer {
    return sha256(input + sha256(input, 'hex'), encoding);
}

export class HashSum {
    private hashsum = createHash('SHA256');
    push(data: WBuffer) {
        try {
            this.hashsum.update(data);
        } catch (error) {
            console.error(error);
        }
    }
    get(): WBuffer;
    get(format: 'hex'): string;
    get(format: 'buffer'): WBuffer;
    get(format = 'buffer') {
        switch (format) {
            case 'hex': return this.hashsum.digest('hex');
            case 'buffer': return WBuffer.from(this.hashsum.digest());
        }
    }
    toString() {return this.get('hex')}
    inspect() {return `<SHA256:${this.toString()}>`}
}

export const EMPTY_HASH = (new HashSum()).get();
