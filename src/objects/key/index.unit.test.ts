import WBuffer from "@/libs/WBuffer";
import { Key, TYPE_KEY_Secp256k1 } from "@/objects/key";
import { KeySecp256k1 } from "@/objects/key/secp256k1";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";

describe('toBuffer', () => {
    test('secp256k1', () => {
        const key = new KeySecp256k1();

        expect(key.toBuffer()).toBe(null);

        const [, publicKey] = getKeyPair();

        key.key = publicKey;

        const bufferA = key.toBuffer();
        const bufferB = WBuffer.concat([
            WBuffer.numberToUleb128Buffer(TYPE_KEY_Secp256k1),
            publicKey
        ]);
        const bufferC = Key.parse(bufferA).toBuffer();

        expect(WBuffer.compare(bufferA, bufferB)).toBe(0);
        expect(WBuffer.compare(bufferA, bufferC)).toBe(0);
    });
});

describe('parse', () => {
    test('secp256k1', () => {
        const [, publicKey] = getKeyPair();
        const buffer = WBuffer.concat([
            WBuffer.numberToUleb128Buffer(TYPE_KEY_Secp256k1),
            publicKey
        ]);
        const key = Key.parse(buffer) as KeySecp256k1;

        expect(key.typeID).toBe(TYPE_KEY_Secp256k1);
        expect(WBuffer.compare(publicKey, key.key)).toBe(0);
    });
});
