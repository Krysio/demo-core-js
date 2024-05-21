import { EventEmitter, TypedEventEmitter } from "node:stream";
import { createConfig, Config } from "@/modules/config";
import { createState } from "@/modules/state";
import { createBlockGenerator } from "@/modules/blockGenerator";
import { createChainTop } from "@/modules/chaintTop";
import { createStoreUser } from "@/modules/storeUser";
import { createStoreBlock } from "@/modules/storeBlock";
import { createStoreCommand } from "@/modules/storeCommand";
import { createCommandParser } from "./modules/commandParser";
import { createCommandAutorizer } from "./modules/commandAutorizer";
import { CommandData } from "./constants";
import { createCommandImplementations } from "./modules/commandImplementations";
import Block from "@/objects/Block";
import WBuffer from "@/libs/WBuffer";
import { createCommandVerifier } from "./modules/commandVerifier";

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
            'commandParser/acceptCommand': [CommandData];
            'commandParser/rejectCommand': [CommandData];
            'commandVerifier/acceptCommand': [CommandData];
            'commandVerifier/rejectCommand': [CommandData];
            'commandAutorizer/acceptCommand': [CommandData];
            'commandAutorizer/rejectCommand': [CommandData];
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
        commandImplementations: createCommandImplementations(protoScope),

        commandParser: createCommandParser(protoScope),
        commandVerifier: createCommandVerifier(protoScope),
        commandAutorizer: createCommandAutorizer(protoScope),

        start: () => scope.events.emit('start'),
        stop: () => scope.events.emit('stop'),
    };

    Object.assign(protoScope, scope);

    scope.events.emit('init/config', initialConfig);

    return scope;
}

export type Node = ReturnType<typeof createNode>;
