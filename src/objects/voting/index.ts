import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { doubleSha256 } from "@/libs/crypto/sha256";
import { BHTime } from "@/modules/time";
import { Key } from "@/objects/key";

/******************************/

export const TYPE_VOTING_SIMPLE = 0;

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

export interface IVoting {
    parseValue(buffer: WBuffer): any;
    toBufferValue(value: any): WBuffer;
}

export class Voting {
    public buffer: WBuffer;
    public typeID: number;
    public timeStart = 0 as BHTime;
    public timeEnd = 0 as BHTime;
    public meta: string = '';
    public isAllowFlow: boolean = true;
    public isSecret: boolean = false;
    public publicKey: Key = null;

    constructor(
        timeStart?: BHTime,
        timeEnd?: BHTime,
        meta = ''
    ) {
        if (timeStart) this.timeStart = timeStart;
        if (timeEnd) this.timeEnd = timeEnd;
        if (meta) this.meta = meta;
    }

    public setType(typeID: number) {
        this.typeID = typeID;

        const Typed = mapOftypes.get(typeID) as typeof Voting;

        if (Typed) {
            Object.setPrototypeOf(this, Typed.prototype);
        }
    }

    //#region buffer

    public static parse(buffer: WBuffer) {
        try {
            const cursor = buffer.cursor;
            const typeID = buffer.readUleb128();
            const Typed = mapOftypes.get(typeID) as typeof Voting;

            if (Typed) {
                buffer.seek(cursor);
                return new Typed().parse(buffer);
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    public parse(buffer: WBuffer): Voting {
        try {
            const cursor = buffer.cursor;

            this.typeID = buffer.readUleb128();
            this.timeStart = buffer.readUleb128() as BHTime;
            this.timeEnd = buffer.readUleb128() as BHTime;
            this.meta = buffer.read(buffer.readUleb128()).utf8();
            this.buffer = buffer.subarray(cursor, buffer.cursor);

            const flags = buffer.readUleb128();

            this.isAllowFlow = !!(flags & 1);
            this.isSecret = !!(flags & 2);

            if (this.isSecret) {
                this.publicKey = Key.parse(buffer);
            }

            return this;
        } catch (error) {
            return null;
        }
    }

    public toBuffer(): WBuffer {
        try {
            let flags = 0;
    
            if (this.isAllowFlow) flags|= 1;
            if (this.isSecret) flags|= 2;

            return this.buffer = WBuffer.concat([
                WBuffer.uleb128(this.typeID),
                WBuffer.uleb128(this.timeStart),
                WBuffer.uleb128(this.timeEnd),
                this.toBufferMeta(),
                WBuffer.uleb128(flags),
                this.isSecret
                    ? this.publicKey.toBuffer()
                    : EMPTY_BUFFER
            ]);
        } catch (error) {
            return null;
        }
    }

    public toBufferMeta() {
        if (this.meta.length === 0) {
            return WBuffer.uleb128(0);
        }

        const manifest = WBuffer.from(this.meta, 'utf8');
        const sizeOfMeta = WBuffer.uleb128(manifest.length);

        return WBuffer.concat([
            sizeOfMeta,
            manifest
        ]);
    }

    //#endregion buffer

    isValidValue(buffer: WBuffer): boolean {
        try {
            (this as unknown as IVoting).parseValue(buffer);
        } catch (error) {
            return false
        }

        return true;
    };

    getHash(): WBuffer {
        return doubleSha256(this.toBuffer());
    }

    public toString() { return this.toBuffer().hex(); }
    public inspect() { return `<${this.constructor.name}{time:[${this.timeStart},${this.timeEnd}],secret:${this.isSecret},flow:${this.isAllowFlow}}>`; }
    public toJSON() { return this.inspect(); }
    [Symbol.for('nodejs.util.inspect.custom')]() { return this.inspect(); }
}

export * from "./simple";
