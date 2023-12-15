import getLazyPromise from "@/libs/LazyPromise";
import { Database } from "sqlite3";

export function createDb() {
    const db = new Database(':memory:');
    const dbReady = getLazyPromise();

    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                userID BLOB PRIMARY KEY,
                data BLOB
            );
        `, () => dbReady.resolve());
    });

    return {db, dbReady};
}

const { db, dbReady } = createDb();

export default db;
export { dbReady };
