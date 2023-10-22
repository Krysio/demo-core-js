import { Database } from "sqlite3";

const db = new Database(':memory:');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            userID INTEGER PRIMARY KEY,
            typeID INTEGER,
            key BLOB,
            areas BLOB,
            timeStart INTEGER,
            timeEnd INTEGER,
            meta TEXT
        );
    `);
});
