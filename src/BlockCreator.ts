import State from "@/State";
import ChainTop from "@/ChainTop";
import Config from "@/config";
import WBuffer from "@/libs/WBuffer";
import Block from "@/objects/Block";
import { Command } from "@/objects/commands/command";
import StoreBlocks from "@/storage/Blocks";
import StoreCommands from "@/storage/Commands";

export default class BlockCreator {
    constructor(
        public state: State,
        public config: Config,
        public chainTop: ChainTop,
        public storeCommands: StoreCommands,
        public storeBlocks: StoreBlocks
    ) {}
    
    create(): void {
        if (!this.state.isWorking || !this.state.isSynced) {
            return;
        }

        const currentHeight = this.chainTop.getHeight();
        const diff = currentHeight - this.chainTop.currentHeight;

        for (let i = 0; i < diff; i++) {
            const index = currentHeight - diff + i;
            const listOfPrevBlock = this.chainTop.getByIndex(index);

            if (!listOfPrevBlock.length) {
                throw new Error('No prev block');
            }

            const commandsByPrevIndex: WBuffer[] = this.storeCommands.getByPrevIndex(index);

            for (const {block: prevBlock} of listOfPrevBlock) {
                const hashOfPrevBlock = prevBlock.getHash();
                const block = new Block();
    
                block.index = index + 1;
                block.hashOfPrevBlock = hashOfPrevBlock;
    
                const commandsByPrevHash: WBuffer[] = this.storeCommands.getByPrevHash(hashOfPrevBlock);
    
                for (const command of commandsByPrevIndex) {
                    block.addCommand(Command.fromBuffer(command));
                }
    
                for (const command of commandsByPrevHash) {
                    block.addCommand(Command.fromBuffer(command));
                }
                
                block.getMerkleRoot();
    
                const effects = block.getCommandEffects();
    
                this.storeBlocks.add(block);    
                this.chainTop.addBlock(block, effects);
            }
        }
    }
}
