import WBuffer from "@/libs/WBuffer";
import { Node } from '@/main';

export function createStoreCommand(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        fakeByIndex: new Map() as Map<number, WBuffer[]>,
        fakeByHash: new Map() as Map<string, WBuffer>,

        getByPrevIndex(index: number): WBuffer[] {
            // TODO
            return [];
        },
        getByPrevHash(hash: WBuffer): WBuffer[] {
            // TODO
            return [];
        },
    };

    return module;
}
