import Time from "@/libs/Time";
import WBuffer from "@/libs/WBuffer";
import { MapOfEffects } from "@/constants";
import Block from "@/objects/Block";
import { Node } from '@/main';

type CacheValue = {block: Block, effects: MapOfEffects};

const sortBlocksByValues = (a: CacheValue, b: CacheValue) => {
    if (a.block.value == b.block.value) {
        return WBuffer.compare(
            a.block.getHash(),
            b.block.getHash()
        );
    }

    return a.block.value < b.block.value ? 1 : -1;
};

export function createChainTop(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        currentHeight: 0,
        blockCache: new Map() as Map<number, CacheValue[]>,

        addBlock(block: Block) {
            const index = block.index;
            const effects = block.getCommandEffects(node);
            const item = {block, effects};
            let existList = this.blockCache.get(index);
    
            if (existList) {
                existList.push(item);
                existList.sort(sortBlocksByValues);
            } else {
                module.blockCache.set(index, [item]);
            }
    
            if (module.currentHeight < index) {
                module.currentHeight = index;
            }
        },
        cleanCache() {
            let toClean = module.getHeight() - 3;
    
            while (module.blockCache.has(toClean)) {
                module.blockCache.delete(toClean);
                toClean--;
            }
        },
        getByIndex(index: number) {
            const list = module.blockCache.get(index);
    
            if (!list) {
                return null;
            }
    
            return list;
        },

        getHeight() {
            const { genesisTime, timeBetweenBlocks } = node.config;
    
            if (timeBetweenBlocks === 0) {
                return 0;
            }
    
            return Math.floor((Time.now() - genesisTime) / timeBetweenBlocks);
        },
        getIndexOfLastBlock() {
            return module.currentHeight;
        }
    };

    node.events.on('creaed/block', (block) => {
        module.addBlock(block);
    });

    return module;
}
