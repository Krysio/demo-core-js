import WBuffer from '@/libs/WBuffer';
import { sha256 } from '@/libs/crypto/sha256';
import { Node } from '@/main';
import { Voting } from '@/objects/voting';

export function createStoreVoting(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        store: new Map<string, WBuffer>(),

        async add(voting: Voting) {
            const data = voting.toBuffer();
            const key = sha256(data).hex();

            return module.store.set(key, data);
        },
        async get(hash: WBuffer) {
            const key = sha256(hash).hex();
            const result = module.store.get(key);

            if (result) {
                const admin = Voting.parse(result.seek(0));

                return admin;
            }

            return null;
        }
    };

    return module;
}
