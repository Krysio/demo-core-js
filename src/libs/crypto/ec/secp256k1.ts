import * as crypto from 'crypto';
import WBuffer from "@/libs/WBuffer";
import getLazyPromise from "@/libs/LazyPromise";
import { instantiateSecp256k1, Secp256k1 } from "@bitauth/libauth";
import * as secp256k1 from "secp256k1";

/******************************/

let bitcoinSecp256k1: Secp256k1 | null = null;
const initWasmPromise = getLazyPromise();

instantiateSecp256k1().then((api) => {
    bitcoinSecp256k1 = api;
    initWasmPromise.resolve(null);
});

export function waitForWasmModule() {
    return initWasmPromise;
}

/******************************/

export function encryptAES256GCM(
    publicKey: WBuffer | Buffer,
    message: WBuffer | Buffer
) {
    const ec = crypto.createECDH('secp256k1');
    const pkSecret = ec.generateKeys(undefined, 'compressed') as unknown as Buffer;
    const secret = ec.computeSecret(publicKey);
    const cipher = crypto.createCipheriv('aes-256-gcm', secret, secret);

    return WBuffer.concat([pkSecret, cipher.update(message), cipher.final()]);
}

export function decryptAES256GCM(
    privateKey: WBuffer | Buffer,
    message: WBuffer | Buffer
) {
    const pkSecret = message.subarray(0, 33);
    const encrypted = message.subarray(-message.length + 33);
    const ec = crypto.createECDH('secp256k1');
    
    ec.setPrivateKey(privateKey);

    const secret = ec.computeSecret(pkSecret);
    const decipher = crypto.createDecipheriv('aes-256-gcm', secret, secret);

    return WBuffer.concat([decipher.update(encrypted)]);
}

/******************************/

/**
 * Return keypair in SEC compressed format
 * @return [privateKey, publicKey]
 */
export function getKeyPair() {
    const ec = crypto.createECDH('secp256k1');
    const publicKey = ec.generateKeys(undefined, 'compressed') as unknown as Buffer;
    const privateKey = ec.getPrivateKey();

    return [
        WBuffer.from(privateKey),
        WBuffer.from(publicKey)
    ];
}

export function compressPublicKey(publicKey: WBuffer | Buffer) {
    return crypto.ECDH.convertKey(publicKey, 'secp256k1', undefined, undefined, 'compressed') as unknown as Buffer;
}

export function decompressPublicKey(publicKey: WBuffer | Buffer) {
    return crypto.ECDH.convertKey(publicKey, 'secp256k1', undefined, undefined, 'uncompressed') as unknown as Buffer;
}

/** Convert to DER spki type format */
export function getDERPublicKey(publicKey: WBuffer | Buffer) {
    return WBuffer.concat([
        WBuffer.from('3056301006072a8648ce3d020106052b8104000a034200', 'hex'),
        decompressPublicKey(publicKey)
    ]);
}

/** Convert to DER sec1 type format */
export function getDerPrivateKey(privateKey: WBuffer | Buffer, publicKey: WBuffer | Buffer) {
    return WBuffer.concat([
        WBuffer.from('30740201010420', 'hex'),
        privateKey,
        WBuffer.from('a00706052b8104000aa144034200', 'hex'),
        decompressPublicKey(publicKey)
    ]);
}

/**
 * @return Uint8Array CompactLowS
 */
export function sign(
    inputPrivateKey: Buffer | Uint8Array,
    inputHash: Buffer | Uint8Array
) {
    if (bitcoinSecp256k1 === null) {
        return secp256k1.ecdsaSign(
            inputHash,
            inputPrivateKey
        ).signature;
    }

    return bitcoinSecp256k1.signMessageHashCompact(
        inputPrivateKey,
        inputHash
    );
}

export function verify(
    inputPublicKey: Buffer | Uint8Array,
    inputHash: Buffer | Uint8Array,
    inputSignature: Buffer | Uint8Array
): boolean {
    if (bitcoinSecp256k1 === null) {
        return secp256k1.ecdsaVerify(
            inputSignature,
            inputHash,
            inputPublicKey
        );
    }

    return bitcoinSecp256k1.verifySignatureCompact(
        inputSignature,
        inputPublicKey,
        inputHash
    );
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
