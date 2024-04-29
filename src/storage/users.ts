import { Database } from "sqlite3";
import WBuffer from "@/libs/WBuffer";

//#region Constants

export const ErrorUnknown = 'Unknown error';
export const ErrorDuplicateID = 'Duplicate ID';

//#endregion Insert

export function createListOfActiveUserID() {
    const db = new Database(':memory:');
    const api = {
        addUserID(userID: WBuffer) {
            return new Promise<void>((resolve, reject) => {
                db.run(
                    `INSERT INTO users(userID) VALUES (?)`,
                    [userID],
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
        hasUserID(userID: WBuffer) {
            return new Promise<boolean>((resolve, reject) => {
                db.get(
                    `SELECT userID FROM users WHERE userID = ?`,
                    [userID],
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
        }
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

export class StoreUsers {
    currentCadency: ReturnType<typeof createListOfActiveUserID> = null;
    nextCadency: ReturnType<typeof createListOfActiveUserID> = null;

    constructor() {
        this.currentCadency = createListOfActiveUserID();
        this.nextCadency = createListOfActiveUserID();
    }

    async active(userID: WBuffer, nextCadency = false) {
        const cadencyDB = await this[nextCadency ? 'nextCadency' : 'currentCadency'];
        const result = await cadencyDB.addUserID(userID);

        return result;
    }

    async isActive(userID: WBuffer) {
        const cadencyDB = await this.currentCadency;
        const result = await cadencyDB.hasUserID(userID);

        return result;
    }

    changeCadency() {
        this.currentCadency = this.nextCadency;
        this.nextCadency = createListOfActiveUserID();
    }
}

export function createStore(){
    return new StoreUsers();
}

const storeUsers = createStore();

export default storeUsers;
