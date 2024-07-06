import WBuffer from '@/libs/WBuffer';
import { doubleSha256 } from '@/libs/crypto/sha256';
import { Voting } from '@/objects/voting';

export function createStoreVoting() {
    const createStore = () => new Map<string, WBuffer>();

    const module = {
        storeCurrent: createStore(),
        storeNext: createStore(),

        async add(voting: Voting, intoNext = false) {
            const data = voting.toBuffer();
            const key = doubleSha256(data).hex();

            if (intoNext) {
                return module.storeNext.set(key, data);
            }

            return module.storeCurrent.set(key, data);
        },
        async addNext(voting: Voting) {
            module.add(voting, true);
        },
        async get(hash: WBuffer) {
            const key = hash.hex();
            const result = module.storeCurrent.get(key);

            if (result) {
                const voting = Voting.parse(result.seek(0));

                return voting;
            }

            return null;
        },
        swip() {
            module.storeCurrent = module.storeNext;
            module.storeNext = createStore();
        },
    };

    return module;
}
