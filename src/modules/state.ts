import { Node } from '@/main';

export function createState(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        isWorking: false,
        isSynced: false,
    };

    node.events.on('start', () => {
        module.isWorking = true;
    });

    node.events.on('stop', () => {
        module.isWorking = false;
    });

    return module;
}
