import { getKeys } from "@/libs/crypto/ec/secp256k1";
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
            const [rootPrivateKey, rootPublicKey] = getKeys();

            beforeAll(mockDb);

            test('Insert root one', async () => {
                await insertRoot(rootPublicKey);
        
                const getResult = await getUser(0);
        
                expect(WBuffer.compare(rootPublicKey, getResult.key)).toBe(0);
                expect(getResult.userID).toBe(0);
                expect(getResult.typeID).toBe(UserTypeRoot);
                expect(getResult.parentID).toBe(0);
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
            const [adminPrivateKey, adminPublicKey] = getKeys();
            const adminID = 1;
            const adminDesc = 'Main admin';

            function insert() {
                return insertAdmin({
                    userID: adminID,
                    parentID: 0,
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
                expect(getResult.parentID).toBe(0);
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
