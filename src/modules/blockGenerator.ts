import { Block } from "@/objects/block";
import { Node } from '@/main';
import { Frame } from "@/objects/frame";
import { isProductionEnv } from "@/helper";

export function createBlockGenerator(refToNode: unknown) {
    let requestCreateBlockTimeoutId: ReturnType<typeof setTimeout> = null;

    const node = refToNode as Node;
    const module = {
        start() {
            module.createNewBlocks();
        },
        stop() {
            if (requestCreateBlockTimeoutId) {
                clearTimeout(requestCreateBlockTimeoutId);
            }
        },
        requestCreateBlock() {
            if (requestCreateBlockTimeoutId) {
                return;
            }

            if (isProductionEnv()) {
                const height = node.chainTop.getHeight();
                const { genesisTime, timeBetweenBlocks } = node.config;
                const timeToWaint = (genesisTime + timeBetweenBlocks * (height + 1)) - node.time.nowUnix();
    
                requestCreateBlockTimeoutId = setTimeout(module.createNewBlocks, timeToWaint);
            } else {
                requestCreateBlockTimeoutId = setTimeout(module.createNewBlocks, 1);
            }
        },
        async createNewBlocks() {
            const currentHeight = node.chainTop.getHeight();
            const prevHeight = node.chainTop.getIndexOfLastBlock();
            const diff = currentHeight - prevHeight;

            for (let i = 0; i < diff; i++) {
                const index = currentHeight - diff + i;
                const listOfPrevBlock = node.chainTop.getByIndex(index);

                if (!listOfPrevBlock || !listOfPrevBlock.length) {
                    throw new Error('No prev block');
                }
    
                const commandsByPrevIndex: Frame[] = node.commandPool.getByIndex(index - 2);

                // apply all index-cmd
                for (const command of commandsByPrevIndex) {
                    if (command.data.apply) {
                        await command.data.apply(node, command);
                    }
                }

                for (const prevBlock of listOfPrevBlock) {
                    const hashOfPrevBlock = prevBlock.getHash();
                    const block = new Block();
        
                    block.index = index + 1;
                    block.hashOfPrevBlock = hashOfPrevBlock;

                    const commandsByPrevHash: Frame[] = node.commandPool.getByHash(hashOfPrevBlock);
        
                    for (const command of commandsByPrevIndex) {
                        block.addCommand(command);
                    }

                    for (const command of commandsByPrevHash) {
                        block.addCommand(command);
                    }

                    node.commandPool.cleanByHash(hashOfPrevBlock);
                    block.getMerkleRoot();

                    node.events.emit('created/block', block);
                }

                node.commandPool.cleanByIndex(index - 2);
            }

            requestCreateBlockTimeoutId = null;
            module.requestCreateBlock();
        }
    };

    node.events.on('start', () => {
        module.start();
    });

    node.events.on('stop', () => {
        module.stop();
    });

    return module;
}
