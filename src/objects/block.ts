import chainTop from "@/chaintop";
import WBuffer from "@/libs/WBuffer";
import { mapOfCommand } from "./types";

const block = new class Block {
    version: number;
    index: number;
    hashOfPrevBlock: WBuffer;
    countOfRows: number;

    verify(buffer: WBuffer) {
        buffer.cursor = 0;

        this.version = buffer.readUleb128();
        this.index = buffer.readUleb128();
        this.hashOfPrevBlock = buffer.read(32);
        this.countOfRows = buffer.readUleb128();

        if (this.version !== 1) return false;
        if (this.index !== chainTop.currentHeight) return false;
        if (WBuffer.compare(this.hashOfPrevBlock, chainTop.hashOfPrevBlock) !== 0) return false;

        for (let i = 0; i < this.countOfRows; i++) {
            const commandSize = buffer.readUleb128();
            const commandBuffer = buffer.read(commandSize);
            const typeID = commandBuffer.readUleb128();

            const command = mapOfCommand.get(typeID);

            if (!command.verifyBlockVersion(commandBuffer, null)) return false;
        }
        
        return true;
    }
}

export default block;