import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import storeUsers, { ErrorDuplicateID } from "@/storage/users";

function mockDb() {
    jest.mock('@/storage/users', () => {
        const store = jest.requireActual('@/storage/users').createStore();

        return { default: store };
    });
}

describe('@/storage/users', () => {
    describe('Inset', () => {
        const [hash1] = getKeyPair();
        const [hash2] = getKeyPair();

        beforeAll(mockDb);

        test('Insert once', async () => {
            await storeUsers.active(hash1);

            const isActive1 = await storeUsers.isActive(hash1);
            const isActive2 = await storeUsers.isActive(hash2);

            expect(isActive1).toBe(true);
            expect(isActive2).toBe(false);
        });

        test('Insert twice', async () => {
            expect(async () => {
                await storeUsers.active(hash1);
            }).rejects.toThrow(ErrorDuplicateID);
        });
    });
});
