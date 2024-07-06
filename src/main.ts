import WBuffer from "@/libs/WBuffer";
import { EventEmitter, TypedEventEmitter } from "node:stream";
import { createConfig } from "@/modules/config";
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
import getLazyPromise from "@/libs/lazyPromise";
import { COMMAND_TYPE_CONFIG, COMMAND_TYPE_GENESIS } from "@/objects/commands/types";
import { ConfigCommand } from "@/objects/commands/config";
import { GenesisCommand } from "./objects/commands/genesis";

function extractConfig(genesisBlock: Block) {
    for (const command of genesisBlock.listOfCommands) {
        if (command.typeID === COMMAND_TYPE_CONFIG) {
            return (command.data as ConfigCommand).values;
        }
    }
}

function extractRootKey(genesisBlock: Block) {
    for (const command of genesisBlock.listOfCommands) {
        if (command.typeID === COMMAND_TYPE_GENESIS) {
            return (command.data as GenesisCommand).rootPublicKey;
        }
    }
}

export function createNode(params: {
    genesisBlock: Block
}) {
    const { genesisBlock: genesis } = params;
    const events = new EventEmitter() as TypedEventEmitter<{
        'init/start': [];
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
    }>;
    const protoScope = {
        events, genesis,
        // load initial config
        config: extractConfig(genesis),
        rootKey: extractRootKey(genesis),
    };

    protoScope.config = createConfig(protoScope);

    const scope = {
        events, genesis,
        rootKey: protoScope.rootKey,
        config: protoScope.config,

        state: createState(protoScope),
        storeUser: createStoreUser(),
        storeAdmin: createStoreAdmin(protoScope),
        storeVoter: createStoreVoter(),
        storeVoting: createStoreVoting(),
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

        whenInit() { return scope.initPromise; },
        whenChainGrowsTo(height: number) {
            const promise = getLazyPromise();
            const check = () => {
                if (scope.chainTop.getIndexOfLastBlock() >= height) {
                    scope.events.off('created/block', check);
                    promise.resolve();
                }
            };

            scope.events.on('created/block', check);
            check();

            return promise;
        },
        initPromise: getLazyPromise(),
    };

    Object.assign(protoScope, scope);

    Promise.all([
        new Promise((resolve) => scope.events.on('init/start', () => resolve(null))),
        new Promise((resolve) => scope.events.on('init/genesis', () => resolve(null))),
        new Promise((resolve) => scope.events.on('init/fs', () => resolve(null))),
    ]).then(() => {
        scope.events.emit('init/end');
        scope.initPromise.resolve();
    });

    scope.events.on('init/fs', () => scope.events.emit('init/genesis', genesis));
    scope.events.emit('init/start');

    return scope;
}

export type Node = ReturnType<typeof createNode>;
