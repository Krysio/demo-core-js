import WBuffer from "@/libs/WBuffer";

/******************************/

export const TYPE_KEY_Secp256k1 = 1;

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

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

/* eslint-enable @typescript-eslint/no-explicit-any */
/* eslint-enable @typescript-eslint/ban-types */

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
    public buffer: WBuffer;
    public typeID: number;
    public key: WBuffer;
    public privateKey: WBuffer = null;

    constructor(
        publicKey?: WBuffer,
        privateKey?: WBuffer
    ) {
        this.key = publicKey || null;
        this.privateKey = privateKey || null;
    }

    public setType(typeID: number) {
        this.typeID = typeID;

        const Typed = mapOftypes.get(typeID) as typeof Key;

        if (Typed) {
            Object.setPrototypeOf(this, Typed.prototype);
        }
    }

    public isEqual(key: Key) {
        if (this.typeID !== key.typeID) return false;
        if (!this.key.isEqual(key.key)) return false;
        return true;
    }

    //#region buffer

    public static parse(buffer: WBuffer) {
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

    /**
     * @param {WBuffer} buffer
     * @param {Function} refToOverrideFunction See Type implementation 
     * @returns {Key | null}
     */
    public parse(buffer: WBuffer): Key {
        try {
            const cursor = buffer.cursor;

            this.typeID = buffer.readUleb128();
            // eslint-disable-next-line prefer-rest-params
            arguments[1].call(this, buffer);
            this.buffer = buffer.subarray(cursor, buffer.cursor);

            return this;
        } catch (error) {
            return null;
        }
    }

    /**
     * @param {Function} refToOverrideFunction See Type implementation
     * @returns {WBuffer}
     */
    public toBuffer(): WBuffer {
        try {
            return this.buffer = WBuffer.concat([
                WBuffer.uleb128(this.typeID),
                // eslint-disable-next-line prefer-rest-params
                arguments[0].call(this)
            ]);
        } catch (error) {
            return null;
        }
    }

    public parseSignature(buffer: WBuffer) {
        const sizeOfSingature = buffer.readUleb128();
        const signature = buffer.read(sizeOfSingature);

        return signature;
    }

    //#endregion buffer
    //#region crypto
    /* eslint-disable @typescript-eslint/no-unused-vars */

    @virtual public sign(hash: WBuffer, privateKey?: WBuffer): WBuffer { return null as WBuffer; }
    @virtual public verify(hash: WBuffer, signature: WBuffer): boolean { return null as boolean; }
    @virtual public encrypt(message: WBuffer): WBuffer { return null as WBuffer; }
    @virtual public decrypt(message: WBuffer, privateKey?: WBuffer): WBuffer { return null as WBuffer; }

    /* eslint-enable @typescript-eslint/no-unused-vars */
    //#endregion crypto
    //#region inspect

    public toString() { return this.toBuffer().hex(); }
    public inspect() { return `<${this.constructor.name}:${WBuffer.hex(this.key)}>`; }
    public toJSON() { return this.inspect(); }
    [Symbol.for('nodejs.util.inspect.custom')]() { return this.inspect(); }

    //#endregion inspect
}

export * from "./secp256k1";
