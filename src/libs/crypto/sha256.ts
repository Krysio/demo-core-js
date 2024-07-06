import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import WBuffer from '../WBuffer';

/******************************/

export function sha256(
    input: WBuffer | Buffer | Uint8Array
): WBuffer {
    const hash = crypto.createHash('sha256').update(input).digest();

    return WBuffer.create(hash);
}

export function doubleSha256(input: WBuffer): WBuffer {
    return sha256(WBuffer.concat([
        sha256(input),
        input
    ]));
};

export function sha256File(
    pathToFile: string
): Promise<WBuffer> {
    return new Promise<WBuffer>((resolve) => {
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
