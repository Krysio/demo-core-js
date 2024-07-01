import WBuffer from "@/libs/WBuffer";
import { EventEmitter, TypedEventEmitter } from "node:stream";
import { createConfig, Config } from "@/modules/config";
import { createState } from "@/modules/state";
import { createBlockGenerator } from "@/modules/blockGenerator";
import { createChainTop } from "@/modules/chaintTop";
import { createStoreUser } from "@/modules/storeUser";
import { createStoreAdmin } from "@/modules/storeAdmin";
import { createStoreVoter } from "@/modules/storeVoter";
import { createStoreVoting } from "@/modules/storeVoting";
import { createStoreBlock } from "@/modules/storeBlock";
import { createCommandParser } from "@/modules/commandParser";
import { createCommandVerifier } from "@/modules/commandVerifier";
import { createCommandPool } from "@/modules/commandPool";
import { createTime } from "@/modules/time";
import { Block } from "@/objects/block";
import { Frame } from "@/objects/frame";
import { createFs } from "@/modules/fs";
import { getConfig } from "@/services/genesis";

export function createNode(params: {
    genesisBlock: Block
}) {
    const { genesisBlock } = params;
    const protoScope = {
        events: new EventEmitter() as TypedEventEmitter<{
            'init/config': [Config];
            'init/genesis': [Block];
            'init/fs': [];
            'init/end': [];

            'start': [];
            'stop': [];

            'created/block': [Block];
            'created/snapshot/user': [{ path: string, hash: WBuffer }];

            'cadency/changed': [{ oldValue: number, newValue: number }],

            'network/receiveCommand': [WBuffer];
            'commandParser/acceptCommand': [Frame];
            'commandParser/rejectCommand': [Frame];
            'commandVerifier/acceptCommand': [Frame];
            'commandVerifier/rejectCommand': [Frame];
        }>
    };
    const scope = {
        events: protoScope.events,
        config: createConfig(protoScope),
        state: createState(protoScope),
        storeUser: createStoreUser(protoScope),
        storeAdmin: createStoreAdmin(protoScope),
        storeVoter: createStoreVoter(protoScope),
        storeVoting: createStoreVoting(protoScope),
        storeBlock: createStoreBlock(protoScope),
        chainTop: createChainTop(protoScope),
        blockGenerator: createBlockGenerator(protoScope),
        fs: createFs(protoScope),
        time: createTime(protoScope),

        commandParser: createCommandParser(protoScope),
        commandVerifier: createCommandVerifier(protoScope),
        commandPool: createCommandPool(protoScope),

        start: () => scope.events.emit('start'),
        stop: () => scope.events.emit('stop'),
    };

    Object.assign(protoScope, scope);

    Promise.all([
        new Promise((resolve) => scope.events.on('init/config', () => resolve(null))),
        new Promise((resolve) => scope.events.on('init/genesis', () => resolve(null))),
        new Promise((resolve) => scope.events.on('init/fs', () => resolve(null))),
    ]).then(() => {
        scope.events.emit('init/end');
    });

    scope.events.emit('init/config', getConfig(genesisBlock));
    scope.events.on('init/fs', () => scope.events.emit('init/genesis', genesisBlock));

    return scope;
}

export type Node = ReturnType<typeof createNode>;
