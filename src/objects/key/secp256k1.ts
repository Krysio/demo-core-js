import WBuffer from "@/libs/WBuffer";
import Key, { IKey, TYPE_KEY_Secp256k1, Type } from ".";
import {
    sign as signSecp256k1,
    verify as verifySecp256k1,
    encryptAES256GCM as encryptSecp256k1,
    decryptAES256GCM as decryptSecp256k1
} from "@/libs/crypto/ec/secp256k1";

export const ERROR_NO_PRIVATE_KEY = 'No private key';

@Type(TYPE_KEY_Secp256k1)
export class KeySecp256k1 extends Key implements IKey {
    parse(buffer: WBuffer) {
        this.key = buffer.read(33);
        return this;
    }

    toBuffer(): WBuffer {
        return this.key;
    }

    parseSignature(buffer: WBuffer): WBuffer {
        return buffer.read(64);
    }

    //#region crypto
    
    sign(hash: WBuffer, privateKey?: WBuffer): WBuffer {
        const key = privateKey || this.privateKey;

        if (!key) throw new Error(ERROR_NO_PRIVATE_KEY);

        return signSecp256k1(
            key,
            hash
        );
    }

    verify(hash: WBuffer, signature: WBuffer): boolean {
        return verifySecp256k1(
            this.key,
            hash,
            signature
        );
    }

    encrypt(message: WBuffer): WBuffer {
        return encryptSecp256k1(
            this.key,
            message
        );
    }

    decrypt(message: WBuffer, privateKey?: WBuffer): WBuffer {
        const key = privateKey || this.privateKey;

        if (!key) throw new Error(ERROR_NO_PRIVATE_KEY);

        return decryptSecp256k1(
            key,
            message
        );
    }

    //#endregion crypto
}
