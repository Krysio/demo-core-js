import getLazyPromise from "@/libs/lazyPromise";
import { Database } from "sqlite3";
import { getKeyPair } from "./libs/crypto/ec/secp256k1";
import { KeySecp256k1 } from "./objects/key";
import User, { UserRoot } from "./objects/user";
import { sha256File } from "./libs/crypto/sha256";
import WBuffer from "./libs/WBuffer";

async function createDB(name: string) {
    const dbUsers = new Database(`./db/${name}.db`);
    const dbUsersReady = getLazyPromise();

    dbUsers.serialize(() => {
        dbUsers.run(`
            CREATE TABLE IF NOT EXISTS users (
                userID BLOB PRIMARY KEY,
                data BLOB
            );
        `, () => dbUsersReady.resolve());
    });

    await dbUsersReady;

    const api = {
        insetUser(user: User) {
            return new Promise<void>((resolve) => dbUsers.run(
                `INSERT INTO users(userID, data) VALUES (?, ?)`,
                [user.userID, user.toBuffer('db')],
                resolve
            ));
        }
    };

    Object.assign(dbUsers, api);

    return dbUsers as Database & typeof api;
}

test.skip('db hash', async () => {
    const a = await createDB('a');
    const b = await createDB('b');

    const aKey = new KeySecp256k1(WBuffer.hex`02ff2f2098e8e2969bdcea367df8a9fff2557a6fc18ed48620d3aea27bf05ede4c`);
    const bKey = new KeySecp256k1(WBuffer.hex`02ac4a557435ea09acb99e24f66a94838202117cc8eede1c06f9369a9daea7101d`);
    const aRootUser = new UserRoot(aKey);
    const bRootUser = new UserRoot(bKey);

    aRootUser.userID = WBuffer.hex`e8e2969bdcea367df8a9fff2557a6fc1`;
    bRootUser.userID = WBuffer.hex`435ea09acb99e24f66a94838202117cc`;

    await a.insetUser(aRootUser);
    await a.insetUser(bRootUser);
    
    await b.insetUser(bRootUser);
    await b.insetUser(aRootUser);

    const aHash = await sha256File(`./db/${'a'}.db`);
    const bHash = await sha256File(`./db/${'b'}.db`);

    console.log([aHash, bHash]);
});

test.skip('db big', async () => {
    const c = await createDB('c');

    for (let i = 0; i < 1e4; i++) {
        const [sk, pk] = getKeyPair();
        const key = new KeySecp256k1(pk);
        const rootUser = new UserRoot(key);

        rootUser.userID = sk.subarray(0, 16);

        await c.insetUser(rootUser);
    }
}, 120e3);