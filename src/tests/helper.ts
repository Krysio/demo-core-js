import { Node } from '@/main';
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { KeySecp256k1 } from "@/objects/key";
import { User, Admin } from "@/objects/users";

export function createKey() {
    const [privateKey, publicKey] = getKeyPair();

    return new KeySecp256k1(publicKey, privateKey);
};

export function createAdmin({
    key = createKey()
} = {}) {
    const admin = new Admin(key);

    return { key, admin };
};

export function createUser({
    key = createKey()
} = {}) {
    const user = new User(key);

    user.timeStart = 100;
    user.timeEnd = 10000;

    return { key, user };
};

export function createFakeNode(override = {}) {
    return Object.assign({
        events: {
            on: () => null as () => void,
            emit: () => null as () => void,
        }
    }, override) as unknown as Node;
};
