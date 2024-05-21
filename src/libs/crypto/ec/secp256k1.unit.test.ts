import WBuffer from "@/libs/WBuffer";
import * as crypto from 'crypto';
import { getKeyPair, sign, verify, encryptAES256GCM, decryptAES256GCM, getDerPrivateKey, getDERPublicKey } from "./secp256k1";
import { sha256 } from "../sha256";

test('secp256k1 + aes-256-gcm', () => {
    const str = 'secp256k1 + aes-256-gcm';
    const [sk, pk] = getKeyPair();

    const encrypted = encryptAES256GCM(pk, WBuffer.from(str));
    const decrypted = decryptAES256GCM(sk, encrypted);

    expect(WBuffer.from(decrypted).toString('utf8')).toBe(str);
});

test('Sign & verify', async () => {
    const str = 'secp256k1';
    const [sk, pk] = getKeyPair();
    const hash = sha256(WBuffer.utf8(str));
    const signatureCompact = sign(sk, hash);

    expect(verify(pk, hash, signatureCompact)).toBe(true);
});

test.skip('Sign & verify node:crypto', () => {
    const str = 'secp256k1';
    const [sk, pk] = getKeyPair();

    const signer = crypto.createSign('SHA256');
    signer.write(str);
    signer.end();

    const signatureDER = signer.sign({
        key: getDerPrivateKey(sk, pk) as unknown as Buffer,
        type: 'sec1',
        format: 'der'
    });

    const verifier = crypto.createVerify('SHA256');
    verifier.write(str);
    verifier.end();

    expect(verifier.verify({
        key: getDERPublicKey(pk) as unknown as Buffer,
        type: 'spki',
        format: 'der'
    }, signatureDER)).toBe(true);
});
