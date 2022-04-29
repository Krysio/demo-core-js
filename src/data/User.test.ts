import BufferWrapper from "@/libs/BufferWrapper";
import { getKeys } from "@/libs/crypto/ec/secp256k1";
import Key, { KeySecp256k1, TYPE_KEY_Secp256k1 } from "./Key";
import User, { TYPE_USER_ROOT, UserRoot } from "./User";

describe('UserRoot', () => {
    test('verify', () => {
        const user = new User().setType(TYPE_USER_ROOT);

        expect(user.isValid()).toBe(false);

        const invalidKeys = [new Key(), new KeySecp256k1()];

        for (const key of invalidKeys) {
            user.setKey(key);
            expect(user.isValid()).toBe(false);
        }

        const [, publicKey] = getKeys();
        const key = new KeySecp256k1(publicKey);

        user.setKey(key);
        expect(user.isValid()).toBe(true);
    });

    test('toBuffer', () => {
        const user = new User().setType(TYPE_USER_ROOT);

        expect(user.toBuffer()).toBe(null);

        const invalidKeys = [new Key(), new KeySecp256k1()];

        for (const key of invalidKeys) {
            user.setKey(key);
            expect(user.toBuffer()).toBe(null);
        }

        const [, publicKey] = getKeys();
        const key = new KeySecp256k1(publicKey);

        user.setKey(key);

        const bufferA = user.toBuffer();
        const bufferB = BufferWrapper.concat([
            BufferWrapper.numberToUleb128Buffer(TYPE_USER_ROOT),
            BufferWrapper.numberToUleb128Buffer(TYPE_KEY_Secp256k1),
            publicKey
        ]);

        expect(BufferWrapper.compare(bufferA, bufferB)).toBe(0);
    });

    describe('fromBuffer', () => {
        test('valid', () => {
            const [, publicKey] = getKeys();
            const buffer = BufferWrapper.concat([
                BufferWrapper.numberToUleb128Buffer(TYPE_USER_ROOT),
                BufferWrapper.numberToUleb128Buffer(TYPE_KEY_Secp256k1),
                publicKey
            ]);
            const user = User.fromBuffer(buffer) as UserRoot;

            expect(user.isValid()).toBe(true);
        });

        test('invalid', () => {
            const buffer = BufferWrapper.concat([
                BufferWrapper.numberToUleb128Buffer(TYPE_USER_ROOT),
                BufferWrapper.numberToUleb128Buffer(TYPE_KEY_Secp256k1),
                Buffer.from('0f', 'hex')
            ]);
            const user = User.fromBuffer(buffer) as UserRoot;

            expect(user.isValid()).toBe(false);
        });
    });
});
