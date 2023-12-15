import { v4 as uuidv4 } from "uuid";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { ErrorDuplicateID, getUser, insertUser } from "./users";
import WBuffer from "@/libs/WBuffer";
import { TYPE_USER_ADMIN, TYPE_USER_ROOT, UserAdmin, UserRoot } from "@/objects/user";
import { KeySecp256k1 } from "@/objects/key";

function mockDb() {
    jest.mock('@/storage/db', () => {
        const {db, dbReady} = jest.requireActual('@/storage/db').createDb();

        return { default: db, dbReady };
    });
}

const EMPTY_UUID = WBuffer.alloc(16).fill(0);

describe('@/storage/users', () => {
    describe('Root', () => {
        describe('Inset', () => {
            const rootID = EMPTY_UUID;
            const [rootPrivateKey, rootPublicKey] = getKeyPair();
            const key = new KeySecp256k1(rootPublicKey);
            const rootUser = new UserRoot(key);

            beforeAll(mockDb);

            test('Insert root one', async () => {
                await insertUser(rootUser);
        
                const user = await getUser(rootID);
        
                expect(user).not.toBe(null);
                expect(user.key.key.hex()).toBe(rootPublicKey.hex());
                expect(user.userID.hex()).toBe(rootID.hex());
                expect(user.parentID.hex()).toBe(EMPTY_UUID.hex());
                expect(user.typeID).toBe(TYPE_USER_ROOT);
                expect(user.level).toBe(0);
                expect(user.timeStart).toBe(0);
                expect(user.timeEnd).toBe(0);
                expect(user.meta).toBe('');
            });

            test('Insert root twice', async () => {
                expect(async () => {
                    await insertUser(rootUser);
                }).rejects.toThrow(ErrorDuplicateID);
            });
        });
    });

    describe('Admin', () => {
        describe('Inset', () => {
            const adminID = WBuffer.from(uuidv4().replaceAll('-', ''), 'hex');
            const adminDesc = 'Main admin';
            const [adminPrivateKey, adminPublicKey] = getKeyPair();
            const key = new KeySecp256k1(adminPublicKey);
            const adminUser = new UserAdmin({
                userID: adminID,
                key,
                meta: JSON.stringify({desc: adminDesc})
            });

            function insert() {
                return insertUser(adminUser);
            }

            beforeAll(mockDb);

            test('Insert admin one', async () => {
                await insert();

                const user = await getUser(adminID);

                expect(user).not.toBe(null);
                expect(user.key.key.hex()).toBe(adminPublicKey.hex());
                expect(user.userID.hex()).toBe(adminID.hex());
                expect(user.parentID.hex()).toBe(EMPTY_UUID.hex());
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
