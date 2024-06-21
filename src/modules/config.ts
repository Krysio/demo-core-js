import { Node } from '@/main';

export function createConfig(refToNode: unknown) {
    const node = refToNode as Node;

    const module = {
        genesisTime: 0,
        timeBetweenBlocks: 0,
        cadencySize: 0,

        countOfVoteTransfer: 0,
        countOfSupportGiving: 0,

        timeLiveOfUserAccount: 0,
        timeBeforeAccountActivation: 0,
    };

    node.events.on('init/config', (initialConfig) => {
        Object.assign(module, initialConfig)
    });

    return module;
}

export type Config = ReturnType<typeof createConfig>;
