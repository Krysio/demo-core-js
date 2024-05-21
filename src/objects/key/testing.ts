import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import Key, { IKey, TYPE_KEY_Testing, Type } from ".";

export const keyTestingApi = {
    parseSignature: (key: KeyTesting, buffer: WBuffer) => {
        return buffer.read(buffer.readUleb128());
    },
    sign: (key: KeyTesting, hash: WBuffer, privateKey?: WBuffer) => EMPTY_BUFFER,
    verify: (key: KeyTesting) => true,
    encrypt: (key: KeyTesting, message: WBuffer) => EMPTY_BUFFER,
    decrypt: (key: KeyTesting, message: WBuffer, privateKey?: WBuffer) => EMPTY_BUFFER,
};

@Type(TYPE_KEY_Testing)
export class KeyTesting extends Key implements IKey {
    parse(buffer: WBuffer) {
        const keySize = buffer.readUleb128();

        this.key = buffer.read(keySize);
        return this;
    }

    toBuffer(): WBuffer {
        return WBuffer.concat([
            WBuffer.uleb128(this.key.length),
            this.key
        ]);
    }

    parseSignature(buffer: WBuffer)
    { return keyTestingApi.parseSignature(this, buffer); }

    sign(hash: WBuffer, privateKey?: WBuffer): WBuffer
    { return keyTestingApi.sign(this, hash, privateKey); }
    verify(): boolean
    { return keyTestingApi.verify(this); }
    encrypt(message: WBuffer): WBuffer
    { return keyTestingApi.encrypt(this, message); }
    decrypt(message: WBuffer, privateKey?: WBuffer): WBuffer
    { return keyTestingApi.decrypt(this, message, privateKey); }
}
