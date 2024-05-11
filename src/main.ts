import { EventEmitter, TypedEventEmitter } from "node:stream";
import { createConfig, Config } from "@/modules/config";
import { createState } from "@/modules/state";
import { createBlockGenerator } from "@/modules/blockGenerator";
import { createChainTop } from "@/modules/chaintTop";
import { createStoreUser } from "@/modules/storeUser";
import { createStoreBlock } from "@/modules/storeBlock";
import { createStoreCommand } from "@/modules/storeCommand";
import Block from "@/objects/Block";
import WBuffer from "@/libs/WBuffer";

export function createNode(initialConfig: Config) {
    const protoScope = {
        events: new EventEmitter() as TypedEventEmitter<{
            'init/config': [Config],
            'start': [],
            'stop': [],
            'creaed/genesis': [Block],
            'creaed/block': [Block],
            'creaed/snapshot/user': [{ path: string, hash: WBuffer }],
        }>
    };
    const scope = {
        events: protoScope.events,
        config: createConfig(protoScope),
        state: createState(protoScope),
        storeUser: createStoreUser(protoScope),
        storeBlock: createStoreBlock(protoScope),
        storeCommand: createStoreCommand(protoScope),
        chainTop: createChainTop(protoScope),
        blockGenerator: createBlockGenerator(protoScope),

        start: () => scope.events.emit('start'),
        stop: () => scope.events.emit('stop'),
    };

    Object.assign(protoScope, scope);

    scope.events.emit('init/config', initialConfig);

    return scope;
}

export type Node = ReturnType<typeof createNode>;
