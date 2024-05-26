import Time from "@/libs/Time";
import { Block } from "@/objects/Block";
import { Node } from '@/main';
import { Frame } from "@/objects/frame";

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
            const height = node.chainTop.getHeight();
            const { genesisTime, timeBetweenBlocks } = node.config;
            const timeToWaint = (genesisTime + timeBetweenBlocks * (height + 1)) - Time.now();

            requestCreateBlockTimeoutId = setTimeout(module.createNewBlocks, timeToWaint);
        },
        createNewBlocks() {
            requestCreateBlockTimeoutId = null;

            const currentHeight = node.chainTop.getHeight();
            const diff = currentHeight - node.chainTop.getIndexOfLastBlock();

            for (let i = 0; i < diff; i++) {
                const index = currentHeight - diff + i;
                const listOfPrevBlock = node.chainTop.getByIndex(index);

                if (!listOfPrevBlock || !listOfPrevBlock.length) {
                    throw new Error('No prev block');
                }
    
                const commandsByPrevIndex: Frame[] = node.commandPool.getByPrevIndex(index);
    
                for (const prevBlock of listOfPrevBlock) {
                    const hashOfPrevBlock = prevBlock.getHash();
                    const block = new Block();
        
                    block.index = index + 1;
                    block.hashOfPrevBlock = hashOfPrevBlock;

                    const commandsByPrevHash: Frame[] = node.commandPool.getByPrevHash(hashOfPrevBlock);
        
                    for (const command of commandsByPrevIndex) {
                        block.addCommand(command);
                    }

                    for (const command of commandsByPrevHash) {
                        block.addCommand(command);
                    }

                    block.getMerkleRoot();

                    node.events.emit('created/block', block);
                }
            }

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
