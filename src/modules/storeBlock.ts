import WBuffer from "@/libs/WBuffer";
import Block from "@/objects/Block";
import { Node } from '@/main';

export function createStoreBlock(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        fakeByIndex: new Map() as Map<number, WBuffer[]>,
        fakeByHash: new Map() as Map<string, WBuffer>,

        add(block: Block) {
            const hexKey = block.getHash().hex();
            const exist = module.fakeByHash.get(hexKey);
            const existList: WBuffer[] = module.fakeByIndex.get(block.index);
    
            if (exist) {
                throw new Error();
            }
    
            const buffer = block.toBuffer();
    
            if (existList) {
                existList.push(buffer);
            } else {
                module.fakeByIndex.set(block.index, [buffer]);
            }
    
            module.fakeByHash.set(hexKey, buffer);
        },
    
        getByHeight(height: number): Block[] {
            // TODO
            return [];
        },

        isExist(hash: WBuffer) {
            // TODO
            return true;
        },
    };

    node.events.on('creaed/block', (block) => {
        module.add(block);
    });

    return module;
}
