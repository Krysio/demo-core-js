import BlockCreator from "./BlockCreator";
import ChainTop from "./ChainTop";
import State from "./State";
import Config from "./config";
import WBuffer from "@/libs/WBuffer";
import Time from "./libs/Time";
import { EMPTY_HASH } from "./libs/crypto/sha256";
import Block from "./objects/Block";
import StoreBlocks from "./storage/Blocks";
import StoreCommands from "./storage/Commands";

test('Create blockchain chain', async () => {
    const genesisBlock = new Block();
    const config = new Config();
    const state = new State();
    const chainTop = new ChainTop(config);
    const proxyStoreCommands = new Proxy({
        getByPrevIndex(index: number) { return []; },
        getByPrevHash(hash: WBuffer) { return []; }
    } as StoreCommands, {});
    const proxyStoreBlocks = new Proxy({
        add: jest.fn() as (block: Block) => void
    } as StoreBlocks, {});
    const blockCreator = new BlockCreator(
        state, config,
        chainTop,
        proxyStoreCommands,
        proxyStoreBlocks
    );

    state.isSynced = true;
    state.isWorking = true;

    config.timeBetweenBlocks = 100;
    config.genesisTime = Time.now() - 2 * config.timeBetweenBlocks - 1;

    genesisBlock.hashOfPrevBlock = EMPTY_HASH;
    genesisBlock.getMerkleRoot();
    chainTop.addBlock(genesisBlock, {
        activeUsers: [],
        deactiveUsers: []
    });

    blockCreator.create();

    expect(proxyStoreBlocks.add).toBeCalledTimes(2);
    expect(chainTop.currentHeight).toBe(2);
});
