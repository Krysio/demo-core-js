import { EventEmitter, TypedEventEmitter } from "node:stream";
import { createConfig, Config } from "@/modules/config";
import { createState } from "@/modules/state";
import { createBlockGenerator } from "@/modules/blockGenerator";
import { createChainTop } from "@/modules/chaintTop";
import { createStoreUser } from "@/modules/storeUser";
import { createStoreBlock } from "@/modules/storeBlock";
import { createCommandParser } from "./modules/commandParser";
import { createCommandImplementations } from "@/modules/commandImplementations";
import { Block } from "@/objects/Block";
import WBuffer from "@/libs/WBuffer";
import { createCommandVerifier } from "@/modules/commandVerifier";
import { createCommandPool } from "@/modules/commandPool";
import { Frame } from "@/objects/frame";

export function createNode(initialConfig: Config) {
    const protoScope = {
        events: new EventEmitter() as TypedEventEmitter<{
            'init/config': [Config];
            'start': [];
            'stop': [];
            'creaed/genesis': [Block];
            'creaed/block': [Block];
            'creaed/snapshot/user': [{ path: string, hash: WBuffer }];

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
        commandImplementations: createCommandImplementations(protoScope),

        commandParser: createCommandParser(protoScope),
        commandVerifier: createCommandVerifier(protoScope),
        commandPool: createCommandPool(protoScope),

        start: () => scope.events.emit('start'),
        stop: () => scope.events.emit('stop'),
    };

    Object.assign(protoScope, scope);

    scope.events.emit('init/config', initialConfig);

    return scope;
}

export type Node = ReturnType<typeof createNode>;
