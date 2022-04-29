import { ec as EC } from 'elliptic';
import { instantiateSecp256k1, Secp256k1 } from 'bitcoin-ts/build/main';
import LazyPromise from "@/libs/LazyPromise";
import BufferWrapper from "@/libs/BufferWrapper";
export type HexPrivateKey = string;
export type HexPublicKey = string;
export type HexSignature = string;

/******************************/

const ec = new EC('secp256k1');

/******************************/

let bitcoinSecp256k1: Secp256k1 | null = null;
let initWasmPromise = null as LazyPromise<null>;

export function waitForWasmModule() {
    if (initWasmPromise === null) {
        initWasmPromise = new LazyPromise<null>();

        (async function(){
            bitcoinSecp256k1 = await instantiateSecp256k1();
            initWasmPromise.resolve(null);
        })();
    }

    return initWasmPromise;
}

/******************************/

/**
 * @return [private, public]
 */
export function getKeys(): [BufferWrapper, BufferWrapper];
export function getKeys(encode: 'hex'): [string, string];
export function getKeys(encode?: 'hex') {
    let key = ec.genKeyPair(),
        privateKey = key.getPrivate(),
        publicKey = key.getPublic();

    switch (encode) {
        case 'hex': return [privateKey.toString('hex'), publicKey.encode('hex', true)];
        default: return [
            BufferWrapper.create(privateKey.toBuffer()),
            BufferWrapper.create(Buffer.from(publicKey.encodeCompressed()))
        ];
    }
}

export function compressPublicKey(publicKey: HexPublicKey): HexPublicKey {
    let keyPair = ec.keyFromPublic(publicKey, 'hex');

    return keyPair.getPublic(true, 'hex');
}

export function decompressPublicKey(publicKey: HexPublicKey): HexPublicKey {
    let keyPair = ec.keyFromPublic(publicKey, 'hex');

    return keyPair.getPublic('hex');
}

/**
 * @return Uint8Array CompactLowS
 */
export function sign(
    inputPrivateKey: Buffer | Uint8Array,
    inputHash: Buffer | Uint8Array
) {
    if (bitcoinSecp256k1 === null) {
        return sign_js(
            inputPrivateKey,
            inputHash
        );
    }

    return bitcoinSecp256k1.signMessageHashCompact(
        inputPrivateKey,
        inputHash
    );
}

/**
 * @return Uint8Array CompactLowS
 */
export function sign_js(
    inputPrivateKey: Buffer | Uint8Array,
    inputHash: Buffer | Uint8Array
) {
    const keyPair = ec.keyFromPrivate(inputPrivateKey);
    const result = ec.sign(
        inputHash,
        keyPair,
        {
            canonical: true
        }
    );

    // convert to compact format
    // https://github.com/indutny/elliptic/issues/164
    return Buffer.concat([
        result.r.toArrayLike(Buffer, 'be', 32),
        result.s.toArrayLike(Buffer, 'be', 32)
    ]) as Uint8Array;
}

export function verify(
    inputPublicKey: Buffer | Uint8Array,
    inputHash: Buffer | Uint8Array,
    inputSignature: Buffer | Uint8Array
): boolean {
    if (bitcoinSecp256k1 === null) {
        return verify_js(
            inputPublicKey,
            inputHash,
            inputSignature
        );
    }

    return bitcoinSecp256k1.verifySignatureCompact(
        inputSignature,
        inputPublicKey,
        inputHash
    );
}

export function verify_js(
    inputPublicKey: Buffer | Uint8Array,
    inputHash: Buffer | Uint8Array,
    inputSignature: Buffer | Uint8Array
): boolean {
    const keyPair = ec.keyFromPublic(inputPublicKey);

    return ec.verify(inputHash, {
        r: inputSignature.slice(0, 32),
        s: inputSignature.slice(32, 64)
    }, keyPair);
}

const PrivateKeyMin = Buffer.from([1]);
const PrivateKeyMax = Buffer.from(
    `
        FFFF FFFF FFFF FFFF
        FFFF FFFF FFFF FFFE
        BAAE DCE6 AF48 A03B
        BFD2 5E8C D036 4140
    `.replace(/\s+/g, ''),
    'hex'
);
export function isValidPrivateKey(
    inputPrivateKey: Buffer | Uint8Array
) {
    if (bitcoinSecp256k1 !== null) {
        return bitcoinSecp256k1.validatePrivateKey(inputPrivateKey);
    }

    if (inputPrivateKey.length !== 32) {
        return false;
    }
    if (Buffer.compare(inputPrivateKey, PrivateKeyMin) === -1) {
        return false;
    }
    if (Buffer.compare(inputPrivateKey, PrivateKeyMax) === 1) {
        return false;
    }

    return true;
}

const PublicKeyMin = Buffer.from(
    `   02
        0000 0000 0000 0000
        0000 0000 0000 0000
        0000 0000 0000 0000
        0000 0000 0000 0000
    `.replace(/\s+/g, ''),
    'hex'
);
const PublicKeyMax = Buffer.from(
    `   03
        FFFF FFFF FFFF FFFF
        FFFF FFFF FFFF FFFF
        FFFF FFFF FFFF FFFF
        FFFF FFFF FFFF FFFF
    `.replace(/\s+/g, ''),
    'hex'
);
/**
 * Valid a public key in compressed format
 * (33 bytes, header byte 0x02 or 0x03).
 * @param inputPublicKey
 */
export function isValidPublicKey(
    inputPublicKey: Buffer | Uint8Array
) {
    if (inputPublicKey.length !== 33) {
        return false;
    }
    if (Buffer.compare(inputPublicKey, PublicKeyMin) === -1) {
        return false;
    }
    if (Buffer.compare(inputPublicKey, PublicKeyMax) === 1) {
        return false;
    }
    return true;
}
