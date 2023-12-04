import LazyPromise from "@/libs/LazyPromise";
import { Database } from "sqlite3";

const db = new Database(':memory:');

export const dbReady = new LazyPromise();

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            userID INTEGER PRIMARY KEY,
            typeID INTEGER,
            level INTEGER,
            parentID INTEGER,
            key BLOB,
            areas BLOB,
            timeStart INTEGER,
            timeEnd INTEGER,
            meta TEXT
        );
    `, () => dbReady.resolve());
});

export default db;
