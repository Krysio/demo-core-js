import Key, { KeySecp256k1, TYPE_KEY_Secp256k1 } from "./Key";
import { getKeys } from "@/libs/crypto/ec/secp256k1";
import BufferWrapper from "@/libs/BufferWrapper";

describe('validate', () => {
    test('secp256k1', () => {
        const key = new Key().setType(TYPE_KEY_Secp256k1);

        expect(key.getType()).toBe(TYPE_KEY_Secp256k1);
        expect(key.isValid()).toBe(false);

        const [, publicKey] = getKeys();

        key.setData(publicKey);

        expect(key.isValid()).toBe(true);
    });
});

describe('toBuffer', () => {
    test('secp256k1', () => {
        const key = new Key().setType(TYPE_KEY_Secp256k1);

        expect(key.toBuffer()).toBe(null);

        const [, publicKey] = getKeys();

        key.setData(publicKey);

        const bufferA = key.toBuffer();
        const bufferB = BufferWrapper.concat([
            BufferWrapper.numberToUleb128Buffer(TYPE_KEY_Secp256k1),
            publicKey
        ]);

        expect(BufferWrapper.compare(bufferA, bufferB)).toBe(0);
    });
});

describe('fromBuffer', () => {
    test('secp256k1', () => {
        const [, publicKey] = getKeys();
        const buffer = BufferWrapper.concat([
            BufferWrapper.numberToUleb128Buffer(TYPE_KEY_Secp256k1),
            publicKey
        ]);
        const key = Key.fromBuffer(buffer) as KeySecp256k1;

        expect(key.getType()).toBe(TYPE_KEY_Secp256k1);
        expect(BufferWrapper.compare(publicKey, key.getData())).toBe(0);
    });
});
