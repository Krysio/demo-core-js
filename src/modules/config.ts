import { Node } from '@/main';

export function createConfig(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        genesisTime: 0,
        timeBetweenBlocks: 0,
        spaceBetweenDBSnapshot: 0,
        countOfVoteTransfer: 0,
        countOfSupportGiving: 0,
        timeLiveOfUserAccount: 0,
        timeLiveOfIncognitoAccount: 0,
        timeBeforeAccountActivation: 0
    };

    node.events.on('init/config', (initialConfig) => {
        Object.assign(module, initialConfig)
    });

    return module;
}

export type Config = Partial<ReturnType<typeof createConfig>>;
