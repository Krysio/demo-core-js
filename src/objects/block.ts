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

    addCommand(command: Command) {
        this.listOfCommands.push(command);
    }

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

    getHash() {
        return sha256(this.toBuffer());
    }

    isValid() {
        if (this.version !== 1) return false;
        if (this.index !== chainTop.getHeight()) return false;
        if (!this.hashOfPrevBlock) return false;
        if (!WBuffer.isEqual(this.hashOfPrevBlock, chainTop.hashOfPrevBlock)) return false;

        for (const command of this.listOfCommands) {
            if (!command.isValid()) return false;
        }

        return true;
    }

    verify(buffer: WBuffer) {
        buffer.cursor = 0;

        this.version = buffer.readUleb128();
        this.index = buffer.readUleb128();
        this.hashOfPrevBlock = buffer.read(32);

        const countOfCommands = buffer.readUleb128();

        if (this.version !== 1) return false;
        if (this.index !== chainTop.getHeight()) return false;
        if (WBuffer.compare(this.hashOfPrevBlock, chainTop.hashOfPrevBlock) !== 0) return false;

        for (let i = 0; i < countOfCommands; i++) {
            const commandSize = buffer.readUleb128();
            const commandBuffer = buffer.read(commandSize);
            const command = Command.fromBuffer(commandBuffer);

            command.setPrevBlock(this);
            if (!command.isValid()) return false;
        }
        
        return true;
    }
}
