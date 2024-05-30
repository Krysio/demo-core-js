import WBuffer from "@/libs/WBuffer";

/******************************/

export const TYPE_KEY_Testing = 0;
export const TYPE_KEY_Secp256k1 = 1;

const mapOftypes = new Map<number, Function>();
export const Type = (typeID: number) => {
    return (target: new (...args: any[]) => any) => {
        const ref = {[target.prototype.constructor.name]: class extends target {
            typeID = typeID;
            constructor(...args: any[]) {
                super(...args);
            }
            // Rewrite calls to base
            parse(buffer: Buffer) {
                return Key.prototype.parse.call(this, buffer, target.prototype.parse);
            }
            toBuffer() {
                return Key.prototype.toBuffer.call(this, target.prototype.toBuffer);
            }
        }};

        mapOftypes.set(typeID, ref[target.prototype.constructor.name]);
        return ref[target.prototype.constructor.name] as unknown as void;
    }
};
const virtual = (
    target: any,
    propertyName: string | symbol,
    descriptor: PropertyDescriptor
) => {
    descriptor.value = () => { throw new Error(`Method "${propertyName.toString()}" of class "${target.constructor.name}" is virtual`) };
};

/******************************/

export interface IKey {
    parse(buffer: WBuffer): void;
    parseSignature(buffer: WBuffer): WBuffer;
    toBuffer(): WBuffer;
    sign(hash: WBuffer, privateKey?: WBuffer): WBuffer;
    verify(hash: WBuffer, signature: WBuffer): boolean;
    encrypt(message: WBuffer): WBuffer;
    decrypt(message: WBuffer, privateKey?: WBuffer): WBuffer;
}

export class Key {
    buffer: WBuffer;
    typeID: number;
    key: WBuffer;
    privateKey: WBuffer = null;

    constructor(
        publicKey?: WBuffer,
        privateKey?: WBuffer
    ) {
        this.key = publicKey || null;
        this.privateKey = privateKey || null;
    }

    setType(typeID: number) {
        this.typeID = typeID;

        const Typed = mapOftypes.get(typeID) as typeof Key;

        if (Typed) {
            Object.setPrototypeOf(this, Typed.prototype);
        }
    }

    //#region buffer

    static parse(buffer: WBuffer) {
        try {
            const cursor = buffer.cursor;
            const typeID = buffer.readUleb128();
            const Typed = mapOftypes.get(typeID) as typeof Key;

            if (Typed) {
                buffer.seek(cursor);
                return new Typed().parse(buffer);
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    parse(buffer: WBuffer): Key {
        try {
            const cursor = buffer.cursor;

            this.typeID = buffer.readUleb128();
            arguments[1].call(this, buffer);
            this.buffer = buffer.subarray(cursor, buffer.cursor);

            return this;
        } catch (error) {
            return null;
        }
    }

    toBuffer(): WBuffer {
        try {
            return this.buffer = WBuffer.concat([
                WBuffer.uleb128(this.typeID),
                arguments[0].call(this)
            ]);
        } catch (error) {
            return null;
        }
    }

    parseSignature(buffer: WBuffer) {
        const sizeOfSingature = buffer.readUleb128();
        const signature = buffer.read(sizeOfSingature);

        return signature;
    }

    //#endregion buffer

    isEqual(key: Key) {
        if (this.typeID !== key.typeID) return false;
        if (!this.key.isEqual(key.key)) return false;
        return true;
    }

    //#region crypto

    @virtual sign(hash: WBuffer, privateKey?: WBuffer): WBuffer { return null as WBuffer; }
    @virtual verify(hash: WBuffer, signature: WBuffer): boolean { return null as boolean; }
    @virtual encrypt(message: WBuffer): WBuffer { return null as WBuffer; }
    @virtual decrypt(message: WBuffer, privateKey?: WBuffer): WBuffer { return null as WBuffer; }

    //#endregion crypto

    public toString() { return this.toBuffer().hex(); }
    public inspect() { return `<${this.constructor.name}:${WBuffer.hex(this.key)}>`; }
    public toJSON() { return this.inspect(); }
    [Symbol.for('nodejs.util.inspect.custom')]() { return this.inspect(); }
}

export * from "./secp256k1";
