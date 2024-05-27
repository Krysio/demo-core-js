import Time from "@/libs/Time";
import WBuffer from "@/libs/WBuffer";
import { Block } from "@/objects/Block";
import { Node } from '@/main';

const sortBlocksByValues = (a: Block, b: Block) => {
    if (a.primaryValue == b.primaryValue) {
        if (a.secondaryValue == b.secondaryValue) {
            return WBuffer.compare(
                a.getHash(),
                b.getHash()
            );
        }
        
        return a.secondaryValue < b.secondaryValue ? 1 : -1;
    }

    return a.primaryValue < b.primaryValue ? 1 : -1;
};

export function createChainTop(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        currentHeight: 0,
        blockCache: new Map() as Map<number, Block[]>,

        addBlock(block: Block) {
            const index = block.index;
            let existList = this.blockCache.get(index);

            if (existList) {
                existList.push(block);
                existList.sort(sortBlocksByValues);
            } else {
                module.blockCache.set(index, [block]);
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

    node.events.on('init/genesis', (genesisBlock) => {
        module.addBlock(genesisBlock);
    });

    node.events.on('created/block', (block) => {
        module.addBlock(block);
    });

    return module;
}
