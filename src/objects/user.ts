import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import Key from "@/objects/key";

const SymInspect = Symbol.for('nodejs.util.inspect.custom');

const EMPTY_UserID = WBuffer.alloc(16).fill(0);

/******************************/

export const TYPE_USER_ROOT = 0;
export const TYPE_USER_ADMIN = 1;
export const TYPE_USER_VOTER = 2;

const mapOftypes = new Map<number, Function>();
export const Type = (typeID: number) => {
    return (target: new (...args: any[]) => any) => {
        const ref = {[target.prototype.constructor.name]: class extends target {
            typeID = typeID;
            constructor(...args: any[]) {
                super(...args);
            }
        }};

        mapOftypes.set(typeID, ref[target.prototype.constructor.name]);
        return ref[target.prototype.constructor.name] as unknown as void;
    }
};

/******************************/

interface IUser {
    fromBufferImplementation(buffer: WBuffer): void;
    toBufferImplementation(): WBuffer;
    isValidImplementation(): boolean;
}

export default class User {
    typeID: number;
    userID: WBuffer;
    parentID: WBuffer;
    listOfAreas: number[] = [];
    key: Key;
    level: number;
    timeStart: number;
    timeEnd: number;
    meta: string;

    setType(typeID: number) {
        this.typeID = typeID;

        const Typed = mapOftypes.get(typeID) as typeof Key;

        if (Typed) {
            Object.setPrototypeOf(this, Typed.prototype);
        }
    }

    //#region buffer

    static fromBuffer(buffer: WBuffer) {
        try {
            const cursor = buffer.cursor;
            const typeID = buffer.readUleb128();
            const Typed = mapOftypes.get(typeID) as typeof User;

            if (Typed) {
                buffer.cursor = cursor;
                return new Typed().fromBuffer(buffer);
            }
        } catch (error) {
            return null;
        }
    }

    fromBuffer(buffer: WBuffer): User {
        try {
            this.typeID = buffer.readUleb128();
            this.userID = buffer.read(16);
            this.key = Key.fromBuffer(buffer);
            (this as unknown as IUser).fromBufferImplementation(buffer);

            return this;
        } catch (error) {
            return null;
        }
    }

    toBuffer(): WBuffer {
        try {
            const typeID = WBuffer.uleb128(this.typeID);
            const key = this.key.toBuffer();
            const data = (this as unknown as IUser).toBufferImplementation();

            return WBuffer.concat([
                typeID,
                this.userID,
                key,
                data
            ]);
        } catch (error) {
            return null;
        }
    }

    //#endregion buffer

    public inspect() {
        return `<${this.constructor.name}:${JSON.stringify({
            userID: this.userID,
            parentID: this.parentID,
            level: this.level,
            timeStart: this.timeStart,
            timeEnd: this.timeEnd,
            meta: this.meta,
            key: this.key
        }, null, '  ')}>`;
    }
    public toJSON() {
        return this.inspect();
    }
    [SymInspect]() {
        return this.inspect();
    }
}

@Type(TYPE_USER_ROOT)
export class UserRoot extends User implements IUser {
    fromBufferImplementation(): void {}
    toBufferImplementation(): WBuffer { return EMPTY_BUFFER; }
    isValidImplementation(): boolean {
        if (!this.userID.isEqual(EMPTY_UserID)) {
            return false;
        }

        return true;
    }
}

@Type(TYPE_USER_ADMIN)
export class UserAdmin extends User implements IUser {
    fromBufferImplementation(buffer: WBuffer) {
        this.timeStart = buffer.readUleb128();
        this.timeEnd = buffer.readUleb128();
        this.level = buffer.readUleb128();

        const sizeOfMeta = buffer.readUleb128();

        this.meta = buffer.read(sizeOfMeta).utf8();
    }

    toBufferImplementation(): WBuffer {
        const timeStart = WBuffer.uleb128(this.timeStart);
        const timeEnd = WBuffer.uleb128(this.timeStart);
        const level = WBuffer.uleb128(this.level);
        const sizeOfMeta = WBuffer.uleb128(this.meta.length);
        const meta = WBuffer.from(this.meta, 'utf8');

        return WBuffer.concat([
            timeStart,
            timeEnd,
            level,
            sizeOfMeta,
            meta
        ]);
    }

    isValidImplementation(): boolean {
        return false;
    }
}

@Type(TYPE_USER_VOTER)
export class UserVoter extends User implements IUser {
    fromBufferImplementation(buffer: WBuffer) {
        const countOfAreas = buffer.readUleb128();

        for (let i = 0; i < countOfAreas; i++) {
            this.listOfAreas.push(
                buffer.readUleb128()
            );
        }

        this.timeStart = buffer.readUleb128();
        this.timeEnd = buffer.readUleb128();

        const sizeOfMeta = buffer.readUleb128();

        this.meta = buffer.read(sizeOfMeta).utf8();
    }

    toBufferImplementation(): WBuffer {
        const countOfAreas = WBuffer.uleb128(this.listOfAreas.length);
        const listOfAreas = this.listOfAreas.map((area) => WBuffer.uleb128(area));
        const timeStart = WBuffer.uleb128(this.timeStart);
        const timeEnd = WBuffer.uleb128(this.timeStart);
        const meta = WBuffer.from(this.meta, 'utf8');

        return WBuffer.concat([
            countOfAreas,
            ...listOfAreas,
            timeStart,
            timeEnd,
            meta
        ]);
    }

    isValidImplementation(): boolean {
        return false;
    }
}
