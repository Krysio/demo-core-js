import LazyPromise from "@/libs/LazyPromise";
import { Database } from "sqlite3";

export function createDb() {
    const db = new Database(':memory:');
    const dbReady = new LazyPromise();

    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                userID TEXT PRIMARY KEY,
                typeID INTEGER,
                level INTEGER,
                parentID TEXT,
                key BLOB,
                areas BLOB,
                timeStart INTEGER,
                timeEnd INTEGER,
                meta TEXT
            );
        `, () => dbReady.resolve());
    });

    return {db, dbReady};
}

const { db, dbReady } = createDb();

export default db;
export { dbReady };
