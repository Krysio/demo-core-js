import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import db, { dbReady } from "@/storage/db";
import User, { TYPE_USER_ADMIN, TYPE_USER_ROOT, TYPE_USER_VOTER } from "@/objects/user";
import Key from "@/objects/key";

//#region Constants

const NIL_UUID = WBuffer.alloc(16).fill(0);

export const ErrorUnknown = 'Unknown error';
export const ErrorDuplicateID = 'Duplicate ID';

type UserType = typeof TYPE_USER_ROOT | typeof TYPE_USER_ADMIN | typeof TYPE_USER_VOTER;

type RowOfUser = {
    userID: Buffer,
    typeID: UserType,
    level: number,
    parentID: Buffer,
    key: Buffer,
    areas: Buffer, // TODO WBufferListOfInteger
    timeStart: number,
    timeEnd: number,
    meta: string
};

//#endregion Constants
//#region Helpers

function enchanceUserRow(row: RowOfUser): User {
    if (row === null) return null;
 
    const user = new User();

    user.setType(row.typeID);
    user.userID = WBuffer.create(row.userID);
    user.key = Key.fromBuffer(WBuffer.create(row.key));
    user.parentID = WBuffer.create(row.parentID);
    user.level = row.level;
    user.timeStart = row.timeStart;
    user.timeEnd = row.timeEnd;
    user.meta = row.meta;
    user.listOfAreas = [];

    const areas = WBuffer.create(row.areas);
    const countOfAreas = areas.readUleb128();

    for (let i = 0; i < countOfAreas; i++) {
        user.listOfAreas.push(
            areas.readUleb128()
        );
    }

    return user;
}

//#endregion Helpers
//#region Get

export async function getUser(userID: WBuffer): Promise<null | User> {
    await dbReady;

    const user = await new Promise<null | User>((resolve, reject) => {
        db.get<RowOfUser>(
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
    userID: WBuffer,
    typeID: number,
    level: number,
    parentID: WBuffer
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
        typeID: TYPE_USER_ROOT,
        level: 0,
        parentID: NIL_UUID,
        areas: WBuffer.hex`00`,
        timeStart: 0,
        timeEnd: 0,
        meta: '',
        key
    });
}

export function insertAdmin(adminData: {
    userID: WBuffer,
    parentID: WBuffer
    key: WBuffer,
    level: number,
    timeStart: number,
    timeEnd: number,
    meta: string
}): Promise<void> {
    return insertCommon({
        typeID: TYPE_USER_ADMIN,
        areas: WBuffer.hex`00`,
        ...adminData
    });
}

export function insertUser(userData: {
    userID: WBuffer,
    parentID: WBuffer
    key: WBuffer,
    level: number,
    areas: WBuffer,
    timeStart: number,
    timeEnd: number,
    meta: string
}): Promise<void> {
    return insertCommon({
        typeID: TYPE_USER_VOTER,
        ...userData
    });
}

//#endregion Insert
