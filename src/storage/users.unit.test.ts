import { getKeys } from "@/libs/crypto/ec/secp256k1";
import { getUser, insertRoot } from "./users";
import WBuffer from "@/libs/WBuffer";


describe('@/storage/users', () => {
    test('Insert root', async () => {
        const [privateKey, publicKey] = getKeys();

        const inserResult = await insertRoot(publicKey);

        expect(inserResult).toBe(true);

        const getResult = await getUser(0);

        expect(WBuffer.compare(publicKey, getResult.key)).toBe(0);
    });
});
