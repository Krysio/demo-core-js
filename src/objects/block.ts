import chainTop from "@/chaintop";
import WBuffer from "@/libs/WBuffer";
import { Command } from "./commands/command";
import { sha256 } from "@/libs/crypto/sha256";

const VERSION = 1;

export default class Block {
    version = VERSION;
    index = 0;
    hashOfPrevBlock: WBuffer;
    listOfCommands: Command[] = [];

    //#region buffer

    static fromBuffer(buffer: WBuffer) {
        const block = new Block();

        return block.fromBuffer(buffer);
    }

    fromBuffer(buffer: WBuffer) {
        this.listOfCommands = [];

        this.version = buffer.readUleb128();
        this.index = buffer.readUleb128();
        this.hashOfPrevBlock = buffer.read(32);

        const countOfCommands = buffer.readUleb128();

        for (let i = 0; i < countOfCommands; i++) {
            this.listOfCommands.push(
                Command.fromBuffer(buffer)
            );
        }

        return this;
    }

    toBuffer(): WBuffer {
        const version = WBuffer.uleb128(this.version);
        const index = WBuffer.uleb128(this.index);
        const countOfCommands = WBuffer.uleb128(this.listOfCommands.length);
        const listOfCommands = this.listOfCommands.map((command) => command.toBuffer());

        listOfCommands.sort(WBuffer.compare);

        return WBuffer.concat([
            version,
            index,
            this.hashOfPrevBlock,
            countOfCommands,
            ...listOfCommands
        ]);
    }

    //#endregion buffer

    addCommand(command: Command) {
        this.listOfCommands.push(command);
    }

    getHash() {
        return sha256(this.toBuffer());
    }

    isValid() {
        if (!this.hashOfPrevBlock) return false;

        for (const command of this.listOfCommands) {
            if (!command.isValid()) return false;
        }

        return true;
    }

    verify() {
        if (this.index !== chainTop.getHeight()) return false;
        if (!this.hashOfPrevBlock.isEqual(chainTop.hashOfPrevBlock)) return false;

        for (const command of this.listOfCommands) {
            command.setPrevBlock(this);

            if (!command.verify()) {
                return false;
            }
        }
        
        return true;
    }

    async apply() {
        for (const command of this.listOfCommands) {
            await command.apply();
        }
    }
}
