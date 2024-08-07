import WBuffer from '@/libs/WBuffer';

export function createStoreActiveUser() {
    const module = {
        currentCadency: new Map<string, WBuffer>(),
        nextCadency: new Map<string, WBuffer>(),

        async addCurrentCadency(key: WBuffer, data: WBuffer) {
            return module.currentCadency.set(key.hex(), data);
        },
        async addNextCadency(key: WBuffer, data: WBuffer) {
            return module.nextCadency.set(key.hex(), data);
        },
        async get(publicKey: WBuffer) {
            return module.currentCadency.get(publicKey.hex()) || null;
        },
        changeCadency() {
            module.currentCadency = module.nextCadency;
            module.nextCadency = new Map<string, WBuffer>();
        },
    };

    return module;
}
