import WBuffer from "@/libs/WBuffer";
import db, { dbReady } from "./db";

const EmptyBuffer = WBuffer.from([0]);

export const UserTypeRoot = 0;
export const UserTypeAdmin = 1;
export const UserTypeUser = 2;

export const ErrorUnknown = 'Unknown error';
export const ErrorDuplicateID = 'Duplicate ID';

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
                    reject(new Error(ErrorUnknown));
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

export async function insertRoot(key: WBuffer): Promise<void> {
    await dbReady;

    const result = await new Promise<void>((resolve, reject) => {
        db.run(
            `INSERT INTO users(userID, typeID, level, parentID, key, areas, timeStart, timeEnd, meta) VALUES(0, ${UserTypeRoot}, 0, 0, ?, ?, 0, 0, "")`, 
            [key, EmptyBuffer],
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

    return result;
}

export async function insertAdmin(adminData: {
    userID: number,
    parentID: number
    key: WBuffer,
    level: number,
    timeStart: number,
    timeEnd: number,
    meta: string
}): Promise<void> {
    await dbReady;

    const result = await new Promise<void>((resolve, reject) => {
        db.run(
            `INSERT INTO users(
                userID,
                typeID,
                level,
                parentID,
                key,
                areas,
                timeStart,
                timeEnd,
                meta
            ) VALUES(
                ?,
                ${UserTypeAdmin},
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )`, 
            [
                adminData.userID,
                adminData.level,
                adminData.parentID,
                adminData.key,
                EmptyBuffer,
                adminData.timeStart,
                adminData.timeEnd,
                adminData.meta
            ],
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

    return result;
}

