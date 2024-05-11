import WBuffer from "@/libs/WBuffer";
import { EMPTY_HASH } from "@/libs/crypto/sha256";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { KeySecp256k1 } from "@/objects/key";
import GenesisCommand from "@/objects/commands/genesis";
import ConfigCommand from "@/objects/commands/config";
import DBSnapshotCommand from "@/objects/commands/db-snapshots";
import Block from "@/objects/Block";
import { Command } from "@/objects/commands/command";
import { Node } from '@/main';
import Time from "@/libs/Time";

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

            const genesisCommand = new GenesisCommand(rootKey);
            const configCommand = new ConfigCommand(node.config);
            const dbSnapshotCommand = new DBSnapshotCommand(EMPTY_HASH);
    
            dbSnapshotCommand.hashOfUsersDB = await node.storeUser.createSnapshot();

            block.addCommand(genesisCommand);
            block.addCommand(configCommand);
            block.addCommand(dbSnapshotCommand);

            node.events.emit('creaed/genesis', block);
            node.events.emit('creaed/block', block);
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
    
                const commandsByPrevIndex: WBuffer[] = node.storeCommand.getByPrevIndex(index);
    
                for (const {block: prevBlock} of listOfPrevBlock) {
                    const hashOfPrevBlock = prevBlock.getHash();
                    const block = new Block();
        
                    block.index = index + 1;
                    block.hashOfPrevBlock = hashOfPrevBlock;

                    const commandsByPrevHash: WBuffer[] = node.storeCommand.getByPrevHash(hashOfPrevBlock);
        
                    for (const command of commandsByPrevIndex) {
                        block.addCommand(Command.fromBuffer(command));
                    }

                    for (const command of commandsByPrevHash) {
                        block.addCommand(Command.fromBuffer(command));
                    }

                    block.getMerkleRoot();

                    node.events.emit('creaed/block', block);
                }
            }

            module.requestCreateBlock();
        }
    };

    node.events.on('init/config', () => {
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
