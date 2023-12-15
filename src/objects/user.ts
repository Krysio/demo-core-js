import { v4 as uuidv4 } from "uuid";
import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { sha256 } from "@/libs/crypto/sha256";
import Key from "@/objects/key";

const SymInspect = Symbol.for('nodejs.util.inspect.custom');

const EMPTY_UUID = WBuffer.alloc(16).fill(0);

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
    fromBufferImplementation(buffer: WBuffer, bufferType: 'db' | 'net' | 'hash'): void;
    toBufferImplementation(bufferType: 'db' | 'net' | 'hash'): WBuffer;
    isValidImplementation(): boolean;
}

export default class User {
    typeID: number;
    userID: WBuffer = EMPTY_UUID;
    parentID: WBuffer = EMPTY_UUID;
    listOfAreas: number[] = [];
    key: Key;
    level: number = 0;
    timeStart: number = 0;
    timeEnd: number = 0;
    meta: string = '';

    setType(typeID: number) {
        this.typeID = typeID;

        const Typed = mapOftypes.get(typeID) as typeof Key;

        if (Typed) {
            Object.setPrototypeOf(this, Typed.prototype);
        }
    }

    //#region buffer

    static fromBuffer(
        buffer: WBuffer,
        bufferType: 'db' | 'net' | 'hash' = 'net'
    ) {
        try {
            const cursor = buffer.cursor;
            const typeID = buffer.readUleb128();
            const Typed = mapOftypes.get(typeID) as typeof User;

            if (Typed) {
                buffer.cursor = cursor;
                return new Typed().fromBuffer(buffer, bufferType);
            }
        } catch (error) {
            return null;
        }
    }

    fromBuffer(
        buffer: WBuffer,
        bufferType: 'db' | 'net' | 'hash' = 'net'
    ): User {
        try {
            this.typeID = buffer.readUleb128();

            if (bufferType !== 'db') {
                this.userID = buffer.read(16);
            }
    
            this.key = Key.fromBuffer(buffer);
            (this as unknown as IUser).fromBufferImplementation(buffer, bufferType);

            return this;
        } catch (error) {
            return null;
        }
    }

    toBuffer(
        bufferType: 'db' | 'net' | 'hash' = 'net'
    ): WBuffer {
        try {
            const typeID = WBuffer.uleb128(this.typeID);
            const userID = bufferType !== 'db'
                ? this.userID
                : EMPTY_BUFFER;
            const key = this.key.toBuffer();
            const data = (this as unknown as IUser).toBufferImplementation(bufferType);

            return WBuffer.concat([
                typeID,
                userID,
                key,
                data
            ]);
        } catch (error) {
            return null;
        }
    }

    //#endregion buffer

    getHash() {
        return sha256(this.toBuffer('hash'));
    }

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

    public static generateUserId() {
        return WBuffer.from(uuidv4().replaceAll('-', ''), 'hex');
    }
}

@Type(TYPE_USER_ROOT)
export class UserRoot extends User implements IUser {
    constructor(
        publicKey?: Key
    ) {
        super();

        if (publicKey) {
            this.key = publicKey;
        }
    }

    fromBufferImplementation(): void {}
    toBufferImplementation(): WBuffer { return EMPTY_BUFFER; }
    isValidImplementation(): boolean {
        if (!this.userID.isEqual(EMPTY_UUID)) {
            return false;
        }

        return true;
    }
}

@Type(TYPE_USER_ADMIN)
export class UserAdmin extends User implements IUser {
    constructor(data?: {
        userID?: WBuffer,
        key?: Key,
        parentID?: WBuffer,
        meta?: string
    }) {
        super();

        if (data) for (const key in data) {
            //@ts-ignore
            this[key] = data[key];
        }
    }

    fromBufferImplementation(
        buffer: WBuffer,
        bufferType: 'db' | 'net' | 'hash' = 'net'
    ) {
        if (bufferType !== 'net') {
            this.parentID = buffer.read(16);
        }

        this.timeStart = buffer.readUleb128();
        this.timeEnd = buffer.readUleb128();
        this.level = buffer.readUleb128();

        const sizeOfMeta = buffer.readUleb128();

        this.meta = buffer.read(sizeOfMeta).utf8();
    }

    toBufferImplementation(
        bufferType: 'db' | 'net' | 'hash' = 'net'
    ): WBuffer {
        const parentID = bufferType !== 'net' ? this.parentID : EMPTY_BUFFER;
        const timeStart = WBuffer.uleb128(this.timeStart);
        const timeEnd = WBuffer.uleb128(this.timeStart);
        const level = WBuffer.uleb128(this.level);
        const sizeOfMeta = WBuffer.uleb128(this.meta.length);
        const meta = WBuffer.from(this.meta, 'utf8');

        return WBuffer.concat([
            parentID,
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
    constructor(data?: {
        userID?: WBuffer,
        key?: Key,
        parentID?: WBuffer,
        meta?: string
    }) {
        super();

        if (data) for (const key in data) {
            //@ts-ignore
            this[key] = data[key];
        }
    }

    fromBufferImplementation(
        buffer: WBuffer,
        bufferType: 'db' | 'net' | 'hash' = 'net'
    ) {
        if (bufferType !== 'net') {
            this.parentID = buffer.read(16);
        }

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

    toBufferImplementation(
        bufferType: 'db' | 'net' | 'hash' = 'net'
    ): WBuffer {
        const parentID = bufferType !== 'net' ? this.parentID : EMPTY_BUFFER;
        const countOfAreas = WBuffer.uleb128(this.listOfAreas.length);
        const listOfAreas = this.listOfAreas.map((area) => WBuffer.uleb128(area));
        const timeStart = WBuffer.uleb128(this.timeStart);
        const timeEnd = WBuffer.uleb128(this.timeStart);
        const meta = WBuffer.from(this.meta, 'utf8');
        const sizeOfMeta = WBuffer.uleb128(meta.length);

        return WBuffer.concat([
            parentID,
            countOfAreas,
            ...listOfAreas,
            timeStart,
            timeEnd,
            sizeOfMeta,
            meta
        ]);
    }

    isValidImplementation(): boolean {
        return false;
    }
}
