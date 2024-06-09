import WBuffer from '@/libs/WBuffer';
import { Node } from '@/main';
import { Key } from '@/objects/key';

export function createStoreVoter(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        store: new Map<string, 1>(),

        async add(publicKey: Key) {
            const key = publicKey.toBuffer().hex();

            return module.store.set(key, 1);
        },
        async has(publicKey: Key | WBuffer) {
            const key = (publicKey instanceof Key ? publicKey.toBuffer() : publicKey).hex();
            const result = module.store.get(key);

            return result ? true : false;
        }
    };

    return module;
}
