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

    const module = {
        store: new Map<string, number>(),

        async add(publicKey: Key | WBuffer, value: number) {
            const key = dbKey(publicKey);

            return module.store.set(key, value);
        },
        async get(publicKey: Key | WBuffer) {
            const key = dbKey(publicKey);
            const result = module.store.get(key);

            if (!result) {
                return null;
            }

            return result;
        }
    };

    return module;
}
