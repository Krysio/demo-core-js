import { Node } from '@/main';
import { BHTime, MS, UnixTime } from "@/modules/time";

export function createConfig(refToNode: unknown) {
    const node = refToNode as Node;

    const module = {
        genesisTime: 0 as UnixTime,
        timeBetweenBlocks: 0 as MS,
        cadencySize: 0 as BHTime,

        countOfVoteTransfer: 0,
        countOfSupportGiving: 0,

        timeLiveOfUserAccount: 0 as BHTime,
        timeBeforeAccountActivation: 0 as BHTime,
    };

    // set initial
    Object.assign(module, node.config);

    return module;
}

export type Config = ReturnType<typeof createConfig>;
export type KeyConfig = keyof Config;
