/**
 * This store is used for authenticate voters
 * Should be fast to read
 * The key is a buffer of public key
 * The value is a time of add - needed for voting authorization
 */

import WBuffer from '@/libs/WBuffer';
import { Node } from '@/main';
import { Key } from '@/objects/key';

export function createStoreVoter(refToNode: unknown) {
    const node = refToNode as Node;

    const dbKey = (publicKey: Key | WBuffer) => (publicKey instanceof Key ? publicKey.toBuffer() : publicKey).hex();
    const createStore = () => new Map<string, number>();

    const module = {
        storeCurrent: createStore(),
        storeNext: createStore(),

        async add(publicKey: Key | WBuffer, value: number, intoNext = false) {
            const key = dbKey(publicKey);

            if (intoNext) {
                return module.storeNext.set(key, value);
            }

            return module.storeCurrent.set(key, value);
        },
        async del(publicKey: Key | WBuffer, fromNext = false) {
            const key = dbKey(publicKey);

            if (fromNext) {
                return module.storeNext.delete(key);
            }

            return module.storeCurrent.delete(key);
        },
        async get(publicKey: Key | WBuffer, fromNext = false) {
            const key = dbKey(publicKey);

            if (fromNext) {
                return module.storeNext.get(key) || null;
            }

            return module.storeCurrent.get(key) || null;
        },
        async addNext(publicKey: Key | WBuffer, value: number) {
            module.add(publicKey, value, true);
        },
        async delNext(publicKey: Key | WBuffer) {
            return module.del(publicKey, true);
        },
        async getNext(publicKey: Key | WBuffer) {
            return module.get(publicKey, true);
        },
        swip() {
            module.storeCurrent = module.storeNext;
            module.storeNext = createStore();
        },
    };

    return module;
}
