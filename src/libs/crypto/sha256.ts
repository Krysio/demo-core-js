import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import WBuffer from '../WBuffer';

/******************************/

export function sha256(
    input: string | WBuffer | Buffer | Uint8Array
): WBuffer {
    let hash
    if (typeof input === 'string') {
        hash = crypto.createHash('sha256').update(input, 'utf8');
    } else {
        hash = crypto.createHash('sha256').update(input);
    }

    const result = hash.digest();

    return WBuffer.create(result);
}

export function sha256File(
    pathToFile: string
): Promise<WBuffer> {
    return new Promise<WBuffer>((resolve, reject) => {
        const fileStream = fs.createReadStream(pathToFile);
        const hasher = crypto.createHash('sha256');
    
        fileStream.pipe(hasher);
        fileStream.on('end', () => {
            hasher.end();
            resolve(WBuffer.create(hasher.read()));
        });
    });
}

export const EMPTY_HASH = WBuffer.alloc(32).fill(0);
