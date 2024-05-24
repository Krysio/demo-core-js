import Time from "@/libs/Time";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { KeySecp256k1 } from "@/objects/key";
import { GenesisCommand } from "@/objects/commands";
import { ConfigCommand } from "@/objects/commands";
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
        async createGenesisBlock() {
            const block = new Block();

            const [rootPrivateKey, rootPublicKey] = getKeyPair();
            const rootKey = new KeySecp256k1(rootPublicKey);

            const genesisCommand = new Frame(new GenesisCommand(rootKey));
            const configCommand = new Frame(new ConfigCommand(node.config));

            block.addCommand(genesisCommand);
            block.addCommand(configCommand);

            block.getMerkleRoot();

            node.fs.saveBlock(block);

            node.events.emit('created/genesis', block);
            node.events.emit('created/block', block);
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

                    node.fs.saveBlock(block);

                    node.events.emit('created/block', block);
                }
            }

            module.requestCreateBlock();
        }
    };

    node.events.on('init/end', () => {
        module.createGenesisBlock();
    });

    node.events.on('start', () => {
        module.start();
    });

    node.events.on('stop', () => {
        module.stop();
    });

    return module;
}
