import { v4 as uuidv4 } from "uuid";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { ErrorDuplicateID, getUser, insertAdmin, insertRoot } from "./users";
import WBuffer from "@/libs/WBuffer";
import { TYPE_USER_ADMIN, TYPE_USER_ROOT } from "@/objects/user";
import { KeySecp256k1 } from "@/objects/key";

function mockDb() {
    jest.mock('@/storage/db', () => {
        const {db, dbReady} = jest.requireActual('@/storage/db').createDb();

        return { default: db, dbReady };
    });
}

const NIL_UUID = WBuffer.alloc(16).fill(0);

describe('@/storage/users', () => {
    describe('Root', () => {
        describe('Inset', () => {
            const rootID = NIL_UUID;
            const [rootPrivateKey, rootPublicKey] = getKeyPair();

            beforeAll(mockDb);

            test('Insert root one', async () => {
                await insertRoot(new KeySecp256k1(rootPublicKey).toBuffer());
        
                const user = await getUser(rootID);
        
                expect(user).not.toBe(null);
                expect(user.key.key.hex()).toBe(rootPublicKey.hex());
                expect(user.userID.hex()).toBe(rootID.hex());
                expect(user.parentID.hex()).toBe(NIL_UUID.hex());
                expect(user.typeID).toBe(TYPE_USER_ROOT);
                expect(user.level).toBe(0);
                expect(user.timeStart).toBe(0);
                expect(user.timeEnd).toBe(0);
                expect(user.meta).toBe('');
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
            const adminID = WBuffer.from(uuidv4().replaceAll('-', ''), 'hex');
            const adminDesc = 'Main admin';

            function insert() {
                return insertAdmin({
                    userID: adminID,
                    parentID: NIL_UUID,
                    key: new KeySecp256k1(adminPublicKey).toBuffer(),
                    level: 0,
                    timeStart: 0,
                    timeEnd: 0,
                    meta: JSON.stringify({desc: adminDesc})
                });
            }

            beforeAll(mockDb);

            test('Insert admin one', async () => {
                await insert();

                const user = await getUser(adminID);

                expect(user).not.toBe(null);
                expect(user.key.key.hex()).toBe(adminPublicKey.hex());
                expect(user.userID.hex()).toBe(adminID.hex());
                expect(user.parentID.hex()).toBe(NIL_UUID.hex());
                expect(user.typeID).toBe(TYPE_USER_ADMIN);
                expect(user.level).toBe(0);
                expect(user.timeStart).toBe(0);
                expect(user.timeEnd).toBe(0);
                expect(JSON.parse(user.meta).desc).toBe(adminDesc);
            });

            test('Insert admin twice', async () => {
                expect(async () => {
                    await insert();
                }).rejects.toThrow(ErrorDuplicateID);
            });
        });
    });
});
