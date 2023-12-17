import WBuffer from "@/libs/WBuffer";
import db, { dbReady } from "@/storage/db";
import User from "@/objects/user";

//#region Constants

export const ErrorUnknown = 'Unknown error';
export const ErrorDuplicateID = 'Duplicate ID';

type RowOfUser = {
    data: Buffer
};

//#endregion Constants
//#region Get

export async function getUser(userID: WBuffer): Promise<null | User> {
    await dbReady;

    const user = await new Promise<null | User>((resolve, reject) => {
        db.users.get<RowOfUser>(
            `SELECT * FROM users WHERE userID = ?`,
            [userID],
            (error, row) => {
                if (error) {
                    reject(new Error(ErrorUnknown));
                    return;
                }

                if (row) {
                    const user = User.fromBuffer(WBuffer.create(row.data), 'db');

                    user.userID = userID;
                    resolve(user);
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

export async function insertUser(
    user: User
): Promise<void> {
    await dbReady;

    const result = await new Promise<void>(
        (resolve, reject) => {
            db.users.run(
                `INSERT INTO users(userID, data) VALUES (?, ?)`,
                [user.userID, user.toBuffer('db')],
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
        }
    );

    return result;
}

//#endregion Insert
