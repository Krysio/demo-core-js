import { createHash, BinaryLike } from 'crypto';

/******************************/

export function sha256(
    input: string,
    encoding: 'hex' | 'base64' = 'hex'
): string {
    let hash = createHash('sha256').update(input, 'utf8');

    return hash.digest(encoding);
}

export function doubleSha256(
    input: string,
    encoding: 'hex' | 'base64' = 'hex'
): string | Buffer {
    return sha256(input + sha256(input, 'hex'), encoding);
}

export class HashSum {
    private hashsum = createHash('sha256');
    push(data: Buffer) {
        try {
            this.hashsum.update(data);
        } catch (error) {
            console.error(error);
        }
    }
    get(): Buffer;
    get(format: 'hex'): string;
    get(format: 'buffer'): Buffer;
    get(format = 'buffer') {
        switch (format) {
            case 'hex': return this.hashsum.digest('hex');
            case 'buffer': return this.hashsum.digest();
        }
    }
    toString() {return this.get('hex')}
    inspect() {return `<sha246:checksum>[${this.toString()}]`}
}

export const EMPTY_HASH = (new HashSum()).get();
