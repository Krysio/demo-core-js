import WBuffer from "@/libs/WBuffer";
import db, { dbReady } from "./db";

export const UserTypeRoot = 0;
export const UserTypeAdmin = 1;
export const UserTypeUser = 2;

type UserType = typeof UserTypeRoot | typeof UserTypeAdmin | typeof UserTypeUser;

type User = {
    userID: number,
    typeID: UserType,
    level: number,
    parentID: number,
    key: WBuffer, // TODO WBufferKey
    areas: WBuffer, // TODO WBufferListOfInteger
    timeStart: number,
    timeEnd: number,
    meta: string // JSON, information about account
};

function enchanceUserRow(row: User): User {
    row.key = WBuffer.from(row.key);
    // TODO areas

    return row;
}

export async function getUser(userID: number): Promise<null | User> {
    await dbReady;

    const user = await new Promise<null | User>((resolve, reject) => {
        db.get<User>(
            `SELECT * FROM users WHERE userID = ${parseInt(userID as any) ?? 'NULL'}`,
            (error, row) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (row) {
                    resolve(enchanceUserRow(row));
                    return;
                }

                resolve(null);
            }
        );
    });

    return user;
}

export async function setUser(userData: User): Promise<boolean> {
    return false;
}

export async function insertRoot(key: WBuffer): Promise<boolean> {
    await dbReady;

    const result = await new Promise<boolean>((resolve) => {
        db.run(
            `INSERT INTO users(userID, typeID, level, parentID, key, areas, timeStart, timeEnd, meta) VALUES(0, 0, 0, 0, ?, ?, ?, 0, "")`, 
            [key, WBuffer.from([0]), Date.now()],
            (error) => {
                if (error) {
                    resolve(false);
                    return;
                }

                resolve(true);
            }
        );
    });
    
    return result;
}
