import { Database } from "sqlite3";
import WBuffer from "@/libs/WBuffer";

//#region Constants

export const ErrorUnknown = 'Unknown error';
export const ErrorDuplicateID = 'Duplicate ID';

//#endregion Insert

export function createListOfActiveUser() {
    const db = new Database(':memory:');
    const api = {
        addUser(publicKey: WBuffer) {
            return new Promise<void>((resolve, reject) => {
                db.run(
                    `INSERT INTO users(publicKey) VALUES (?)`,
                    [publicKey],
                    (error: Error & {code: string}) => {
                        if (error) {
                            if (error.code === 'SQLITE_CONSTRAINT') {
                                reject(new Error(ErrorDuplicateID));
                                return;
                            }
        
                            reject(new Error(ErrorUnknown));
                            return;
                        }
        
                        resolve();
                    }
                );
            });
        },
        hasUser(publicKey: WBuffer) {
            return new Promise<boolean>((resolve, reject) => {
                db.get(
                    `SELECT userID FROM users WHERE userID = ?`,
                    [publicKey],
                    (error, row) => {
                        if (error) {
                            reject(new Error(ErrorUnknown));
                            return;
                        }
        
                        if (row) {
                            resolve(true);
                            return;
                        }
        
                        resolve(false);
                    }
                );
            });
        },
        snapshot() {}
    };

    return new Promise<Database & typeof api>((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    userID BLOB PRIMARY KEY
                );
            `, () => resolve(Object.assign(db, api)));
        });
    });
}

import { Node } from '@/main';
import { EMPTY_HASH } from "@/libs/crypto/sha256";

export function createStoreUser(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        currentCadency: createListOfActiveUser(),
        nextCadency: createListOfActiveUser(),

        async active(publicKey: WBuffer, nextCadency = false) {
            const cadencyDB = await module[nextCadency ? 'nextCadency' : 'currentCadency'];
            const result = await cadencyDB.addUser(publicKey);
    
            return result;
        },
        async isActive(publicKey: WBuffer) {
            const cadencyDB = await module.currentCadency;
            const result = await cadencyDB.hasUser(publicKey);
    
            return result;
        },
        async createSnapshot() {
            // TODO
            const path = 'TODO';
            const hash = EMPTY_HASH;

            node.events.emit('creaed/snapshot/user', { path, hash });

            return hash;
        },

        changeCadency() {
            module.currentCadency = module.nextCadency;
            module.nextCadency = createListOfActiveUser();
        },
    };

    return module;
}
