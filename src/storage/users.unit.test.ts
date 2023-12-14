import { v4 as uuidv4, NIL as NIL_UUID } from "uuid";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { ErrorDuplicateID, UserTypeAdmin, UserTypeRoot, getUser, insertAdmin, insertRoot } from "./users";
import WBuffer from "@/libs/WBuffer";

function mockDb() {
    jest.mock('@/storage/db', () => {
        const {db, dbReady} = jest.requireActual('@/storage/db').createDb();

        return { default: db, dbReady };
    });
}

describe('@/storage/users', () => {
    describe('Root', () => {
        describe('Inset', () => {
            const rootID = NIL_UUID;
            const [rootPrivateKey, rootPublicKey] = getKeyPair();

            beforeAll(mockDb);

            test('Insert root one', async () => {
                await insertRoot(rootPublicKey);
        
                const getResult = await getUser(rootID);
        
                expect(WBuffer.compare(rootPublicKey, getResult.key)).toBe(0);
                expect(getResult.userID).toBe(rootID);
                expect(getResult.typeID).toBe(UserTypeRoot);
                expect(getResult.parentID).toBe(NIL_UUID);
                expect(getResult.level).toBe(0);
                expect(getResult.timeStart).toBe(0);
                expect(getResult.timeEnd).toBe(0);
                expect(getResult.meta).toBe('');
            });

            test('Insert root twice', async () => {
                expect(async () => {
                    await insertRoot(rootPublicKey);
                }).rejects.toThrow(ErrorDuplicateID);
            });
        });
    });

    describe('Admin', () => {
        describe('Inset', () => {
            const [adminPrivateKey, adminPublicKey] = getKeyPair();
            const adminID = uuidv4();
            const adminDesc = 'Main admin';

            function insert() {
                return insertAdmin({
                    userID: adminID,
                    parentID: NIL_UUID,
                    key: adminPublicKey,
                    level: 0,
                    timeStart: 0,
                    timeEnd: 0,
                    meta: JSON.stringify({desc: adminDesc})
                });
            }

            beforeAll(mockDb);

            test('Insert admin one', async () => {
                await insert();

                const getResult = await getUser(adminID);

                expect(WBuffer.compare(adminPublicKey, getResult.key)).toBe(0);
                expect(getResult.userID).toBe(adminID);
                expect(getResult.typeID).toBe(UserTypeAdmin);
                expect(getResult.parentID).toBe(NIL_UUID);
                expect(getResult.level).toBe(0);
                expect(getResult.timeStart).toBe(0);
                expect(getResult.timeEnd).toBe(0);
                expect(JSON.parse(getResult.meta).desc).toBe(adminDesc);
            });

            test('Insert admin twice', async () => {
                expect(async () => {
                    await insert();
                }).rejects.toThrow(ErrorDuplicateID);
            });
        });
    });
});
