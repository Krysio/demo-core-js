import { EventEmitter, TypedEventEmitter } from "node:stream";
import { createConfig, Config } from "@/modules/config";
import { createState } from "@/modules/state";
import { createBlockGenerator } from "@/modules/blockGenerator";
import { createChainTop } from "@/modules/chaintTop";
import { createStoreUser } from "@/modules/storeUser";
import { createStoreBlock } from "@/modules/storeBlock";
import { createCommandParser } from "./modules/commandParser";
import { Block } from "@/objects/Block";
import WBuffer from "@/libs/WBuffer";
import { createCommandVerifier } from "@/modules/commandVerifier";
import { createCommandPool } from "@/modules/commandPool";
import { Frame } from "@/objects/frame";
import { nextTick } from "node:process";
import { createFs } from "./modules/fs";

export function createNode(initialConfig: Config) {
    const protoScope = {
        events: new EventEmitter() as TypedEventEmitter<{
            'init/config': [Config];
            'init/fs': [];
            'init/end': [];
            'start': [];
            'stop': [];
            'created/genesis': [Block];
            'created/block': [Block];
            'created/snapshot/user': [{ path: string, hash: WBuffer }];

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
        storeBlock: createStoreBlock(protoScope),
        chainTop: createChainTop(protoScope),
        blockGenerator: createBlockGenerator(protoScope),
        fs: createFs(protoScope),

        commandParser: createCommandParser(protoScope),
        commandVerifier: createCommandVerifier(protoScope),
        commandPool: createCommandPool(protoScope),

        start: () => scope.events.emit('start'),
        stop: () => scope.events.emit('stop'),
    };

    Object.assign(protoScope, scope);

    nextTick(() => {
        scope.events.emit('init/config', initialConfig);
    });

    Promise.all([
        new Promise((resolve) => scope.events.on('init/config', () => resolve(null))),
        new Promise((resolve) => scope.events.on('init/fs', () => resolve(null))),
    ]).then(() => {
        scope.events.emit('init/end');
    });

    return scope;
}

export type Node = ReturnType<typeof createNode>;
