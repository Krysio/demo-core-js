import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Command } from "./commands/command";
import { doubleSha256, sha256 } from "@/libs/crypto/sha256";
import { merkleCreateRoot } from "@/libs/merkle";
import { MapOfEffects } from "@/constants";

const VERSION = 1;

export default class Block {
    version = VERSION;
    index = 0;
    hashOfPrevBlock: WBuffer;
    merkleRootHash: WBuffer;
    value = 0;
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
        this.merkleRootHash = buffer.read(32);
        this.value = buffer.readUleb128();
        this.isDirtyMerkleRoot = false;

        const countOfCommands = buffer.readUleb128();

        for (let i = 0; i < countOfCommands; i++) {
            this.listOfCommands.push(
                Command.fromBuffer(buffer)
            );
        }

        return this;
    }

    toBuffer(
        bufferType: 'header' | 'full' = 'full'
    ): WBuffer {
        const version = WBuffer.uleb128(this.version);
        const index = WBuffer.uleb128(this.index);
        const merkleRootHash = this.getMerkleRoot();
        const value = WBuffer.uleb128(this.value);
        const countOfCommands = WBuffer.uleb128(this.listOfCommands.length);

        return WBuffer.concat([
            version,
            index,
            this.hashOfPrevBlock,
            merkleRootHash,
            value,
            countOfCommands,
            ...(bufferType !== 'header' ? this.listOfCommands.map((command) => {
                return command.toBuffer();
            }) : [EMPTY_BUFFER])
        ]);
    }

    //#endregion buffer

    isDirtyMerkleRoot = true;

    getMerkleRoot() {
        if (this.isDirtyMerkleRoot === false) {
            return this.merkleRootHash;
        }
        
        const listOfHashes: WBuffer[] = [];

        for (const command of this.listOfCommands) {
            listOfHashes.push(
                sha256(command.toBuffer('block'))
            );
        }

        this.merkleRootHash = merkleCreateRoot(listOfHashes);
        this.isDirtyMerkleRoot = false;

        return this.merkleRootHash;
    }

    addCommand(command: Command) {
        this.listOfCommands.push(command);
        this.listOfCommands.sort((a, b) => WBuffer.compare(
            a.toBuffer('block'),
            b.toBuffer('block')
        ));
        this.value+= command.value;
    }

    getHash() {
        return doubleSha256(this.toBuffer('header'));
    }

    isValid() {
        if (!this.hashOfPrevBlock) return false;

        for (const command of this.listOfCommands) {
            if (!command.isValid()) return false;
        }

        return true;
    }

    verifyCommands() {
        for (const command of this.listOfCommands) {
            command.setBlock(this);

            if (!command.verify()) {
                return false;
            }
        }
        
        return true;
    }
    
    getCommandEffects() {
        const effects: MapOfEffects = {
            activeUsers: [],
            deactiveUsers: []
        };

        for (const command of this.listOfCommands) {
            command.getEffects(effects);
        }

        return effects;
    }
}
