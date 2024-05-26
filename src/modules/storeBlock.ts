import { Block } from "@/objects/Block";
import { Node } from '@/main';

export function createStoreBlock(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        getBlockName(block: Block) {
            const hexIndex = `0000000${block.index.toString(16)}`.substring(-8);
            const hash = block.getHash().hex();

            return `${hexIndex}-${hash}.bin`;
        },

        add(block: Block) {
            const blockName = module.getBlockName(block);
            const data = block.toBuffer('full');

            node.fs.saveBlock(blockName, data);
        }
    };

    node.events.on('init/genesis', (genesisBlock) => {
        module.add(genesisBlock);
    });

    node.events.on('created/block', (block) => {
        module.add(block);
    });

    return module;
}
