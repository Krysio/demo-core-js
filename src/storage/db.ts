import getLazyPromise from "@/libs/lazyPromise";
import * as fs from "node:fs";
import { Database } from "sqlite3";

const dbReady = getLazyPromise();
const db = {
    'users': null as Database
};

export async function createDb() {
    if (!fs.existsSync('./db')) {
        fs.mkdirSync('./db', 0x744);
    }

    const dbUsers = new Database('./db/users.db');
    const dbUsersReady = getLazyPromise();

    dbUsers.serialize(() => {
        dbUsers.run(`
            CREATE TABLE IF NOT EXISTS users (
                userID BLOB PRIMARY KEY,
                data BLOB
            );
        `, () => dbUsersReady.resolve());
    });

    await Promise.all([
        dbUsersReady
    ]);

    db['users'] = dbUsers;

    dbReady.resolve();
}

export default db;
export { dbReady };
