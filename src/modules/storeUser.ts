import WBuffer from '@/libs/WBuffer';
import { Node } from '@/main';

export function createStoreUser(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        store: new Map<string, WBuffer>(),

        async add(key: WBuffer, data: WBuffer) {
            return module.store.set(key.hex(), data);
        },
        async get(publicKey: WBuffer) {
            return module.store.get(publicKey.hex()) || null;
        }
    };

    return module;
}
