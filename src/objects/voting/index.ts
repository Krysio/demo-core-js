import WBuffer from "@/libs/WBuffer";

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
    parse(buffer: WBuffer): void;
    toBuffer(): WBuffer;
}

export class Voting {
    public buffer: WBuffer;
    public typeID: number;
    public timeStart: number = 0;
    public timeEnd: number = 0;
    public meta: string = '';

    constructor(
        timeStart?: number,
        timeEnd?: number,
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
            this.timeStart = buffer.readUleb128();
            this.timeEnd = buffer.readUleb128();
            this.meta = buffer.read(buffer.readUleb128()).utf8();
            this.buffer = buffer.subarray(cursor, buffer.cursor);

            return this;
        } catch (error) {
            return null;
        }
    }

    public toBuffer(): WBuffer {
        try {
            return this.buffer = WBuffer.concat([
                WBuffer.uleb128(this.typeID),
                WBuffer.uleb128(this.timeStart),
                WBuffer.uleb128(this.timeEnd),
                this.toBufferMeta(),
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

    public toString() { return this.toBuffer().hex(); }
    public inspect() { return `<${this.constructor.name}}>`; }
    public toJSON() { return this.inspect(); }
    [Symbol.for('nodejs.util.inspect.custom')]() { return this.inspect(); }
}

export * from "./simple";
