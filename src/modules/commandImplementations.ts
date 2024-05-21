import { CommandImplementation } from '@/constants';
import { Node } from '@/main';

export function createCommandImplementations(refToNode: unknown) {
    const node = refToNode as Node;
    const map = new Map<number, CommandImplementation>();

    const module = {
        get: (typeID: number) => map.get(typeID) || null,
        add: (typeID: number, implementation: CommandImplementation) => map.set(typeID, implementation),
    };

    return module;
}
