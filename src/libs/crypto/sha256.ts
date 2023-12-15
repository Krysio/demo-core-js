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
        hash = createHash('sha256').update(input, 'utf8');
    } else {
        hash = createHash('sha256').update(input);
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
    encoding?: 'hex' | 'base64'
): string | WBuffer {
    return sha256(input + sha256(input, 'hex'), encoding);
}

export const EMPTY_HASH = WBuffer.alloc(32).fill(0);
