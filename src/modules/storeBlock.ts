import { Block } from "@/objects/block";
import { Node } from '@/main';
import WBuffer from "@/libs/WBuffer";
import { isProduction } from "@/helper";

export function createStoreBlock(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        mapIndexToHash: new Map<number, WBuffer[]>(),
        storeByindex: new Map<number, WBuffer[]>(),
        storeByHash: new Map<string, WBuffer>(),
        isFsUsed: isProduction() ? true : false,

        getBlockName(block: Block) {
            const hexIndex = `0000000${block.index.toString(16)}`.substring(-8);
            const hash = block.getHash().hex();

            return `${hexIndex}-${hash}.bin`;
        },

        async add(block: Block) {
            const data = block.toBuffer('full');
            const hash = block.getHash();

            const listOfHash = module.mapIndexToHash.get(block.index) || [];

            if (listOfHash.length === 0) {
                module.mapIndexToHash.set(block.index, listOfHash);
            }

            listOfHash.push(hash);

            if (module.isFsUsed) {
                const blockName = module.getBlockName(block);

                await node.fs.saveBlock(blockName, data);
            } else {
                const listOfHash = module.storeByindex.get(block.index) || [];

                if (listOfHash.length === 0) {
                    module.storeByindex.set(block.index, listOfHash);
                }

                listOfHash.push(data);
                module.storeByHash.set(hash.hex(), data);
            }
        },

        async getByHash(hash: WBuffer) {
            if (module.isFsUsed) {
                // TODO
                return null;
            } else {
                const result = module.storeByHash.get(hash.hex());

                if (result) {
                    const block = Block.parse(result.seek(0));

                    return block;
                }
            }

            return null;
        },

        async getByIndex(index: number) {
            if (module.isFsUsed) {
                // TODO
                return null;
            } else {
                const result = module.storeByindex.get(index);

                if (result) {
                    return result.map((buffer) => {
                        return Block.parse(buffer.seek(0));
                    });
                }
            }

            return null;
        },
    };

    node.events.on('init/genesis', (genesisBlock) => {
        module.add(genesisBlock);
    });

    node.events.on('created/block', (block) => {
        module.add(block);
    });

    return module;
}
