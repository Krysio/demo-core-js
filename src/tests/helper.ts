import { Node } from '@/main';
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { KeySecp256k1 } from "@/objects/key";
import { User, Admin } from "@/objects/users";
import { sha256 } from '@/libs/crypto/sha256';

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function createKey() {
    const [privateKey, publicKey] = getKeyPair();

    return new KeySecp256k1(publicKey, privateKey);
};

export function createRandomHash() {
    const [privateKey] = getKeyPair();

    return sha256(privateKey);
};

export function createAdmin({
    key = createKey(),
    parentKey = createKey()
} = {}) {
    const admin = new Admin(key);

    admin.parentPublicKey = parentKey;

    return { key, admin };
};

export function createUser({
    key = createKey(),
    parentKey = createKey()
} = {}) {
    const user = new User(key);

    user.parentPublicKey = parentKey;
    user.timeStart = 100;
    user.timeEnd = 10000;

    return { key, user };
};

export function createFakeNode(override: DeepPartial<Node> = {}) {
    return Object.assign({
        events: {
            on: () => null as () => void,
            emit: () => null as () => void,
        },
    }, override) as unknown as Node;
};
