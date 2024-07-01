import WBuffer from '@/libs/WBuffer';
import { Node } from '@/main';
import { Frame } from "@/objects/frame";
import { TYPE_ANCHOR_HASH, TYPE_ANCHOR_INDEX } from '@/objects/commands';

export function createCommandPool(refToNode: unknown) {
    const node = refToNode as Node;

    const module = {
        add(frame: Frame) {
            switch (frame.data.anchorTypeID) {
                case TYPE_ANCHOR_HASH: {
                    const key = frame.anchorHash.hex();
                    const listOfCommand = module.byHash.get(key) || [];

                    listOfCommand.push(frame);
                    module.byHash.set(key, listOfCommand);
                } break;
                case TYPE_ANCHOR_INDEX: {
                    const listOfCommand = module.byIndex.get(frame.anchorIndex) || [];

                    listOfCommand.push(frame);
                    module.byIndex.set(frame.anchorIndex, listOfCommand);
                 } break;
            }
        },

        byIndex: new Map() as Map<number, Frame[]>,
        byHash: new Map() as Map<string, Frame[]>,

        getByIndex(index: number): Frame[] {
            return module.byIndex.get(index) || [];
        },
        getByHash(hash: WBuffer): Frame[] {
            return module.byHash.get(hash.hex()) || [];
        },
        cleanByIndex(index: number): void {
            module.byIndex.delete(index);
        },
        cleanByHash(hash: WBuffer): void {
            module.byHash.delete(hash.hex());
        },
    };

    node.events.on('commandVerifier/acceptCommand', (commandData) => {
        module.add(commandData);
    });

    return module;
}
