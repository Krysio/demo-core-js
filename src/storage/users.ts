import { NIL as NIL_UUID } from "uuid";
import WBuffer from "@/libs/WBuffer";
import db, { dbReady } from "./db";

//#region Constants

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

//#endregion Constants
//#region Helpers

function enchanceUserRow(row: User): User {
    row.key = WBuffer.from(row.key);
    // TODO areas

    return row;
}

//#endregion Helpers
//#region Get

export async function getUser(userID: string): Promise<null | User> {
    await dbReady;

    const user = await new Promise<null | User>((resolve, reject) => {
        db.get<User>(
            `SELECT * FROM users WHERE userID = ?`,
            [userID],
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

//#endregion Get
//#region Insert

async function insertCommon(adminData: {
    userID: string,
    typeID: number,
    level: number,
    parentID: string
    key: WBuffer,
    areas: WBuffer,
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
            ) VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                adminData.userID,
                adminData.typeID,
                adminData.level,
                adminData.parentID,
                adminData.key,
                adminData.areas,
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

export function insertRoot(key: WBuffer): Promise<void> {
    return insertCommon({
        userID: NIL_UUID,
        typeID: UserTypeRoot,
        level: 0,
        parentID: NIL_UUID,
        areas: EmptyBuffer,
        timeStart: 0,
        timeEnd: 0,
        meta: '',
        key
    });
}

export function insertAdmin(adminData: {
    userID: string,
    parentID: string
    key: WBuffer,
    level: number,
    timeStart: number,
    timeEnd: number,
    meta: string
}): Promise<void> {
    return insertCommon({
        typeID: UserTypeAdmin,
        areas: EmptyBuffer,
        ...adminData
    });
}

export function insertUser(userData: {
    userID: string,
    parentID: string
    key: WBuffer,
    level: number,
    areas: WBuffer,
    timeStart: number,
    timeEnd: number,
    meta: string
}): Promise<void> {
    return insertCommon({
        typeID: UserTypeUser,
        ...userData
    });
}

//#endregion Insert
