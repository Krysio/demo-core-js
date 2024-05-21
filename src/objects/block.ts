import WBuffer from "@/libs/WBuffer";
import { doubleSha256, sha256, EMPTY_HASH } from "@/libs/crypto/sha256";
import { merkleCreateRoot } from "@/libs/merkle";
import { Frame } from "@/objects/frame";

const VERSION = 1;

export class Block {
    public version = VERSION;
    public index = 0;
    public hashOfPrevBlock: WBuffer = EMPTY_HASH;
    public merkleRootHash: WBuffer = EMPTY_HASH;
    public value = 0;
    public listOfCommands: Frame[] = [];

    //#region buffer

    public static parse(buffer: WBuffer) {
        const block = new Block();

        return block.parse(buffer);
    }

    public parse(buffer: WBuffer) {
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
                Frame.parse(buffer, 'block')
            );
        }

        return this;
    }

    public toBuffer(target: 'header' | 'full' = 'full'): WBuffer {
        const version = WBuffer.uleb128(this.version);
        const index = WBuffer.uleb128(this.index);
        const merkleRootHash = this.getMerkleRoot();
        const value = WBuffer.uleb128(this.value);

        return WBuffer.concat([
            version,
            index,
            this.hashOfPrevBlock,
            merkleRootHash,
            value,
            this.toBufferCommands(target)
        ]);
    }

    public toBufferCommands(target: 'header' | 'full' = 'full') {
        if (target === 'header') {
            return WBuffer.uleb128(this.listOfCommands.length);
        }

        return WBuffer.concat([
            WBuffer.uleb128(this.listOfCommands.length),
            ...this.listOfCommands.map((frame) => frame.toBuffer('block'))
        ]);
    }

    //#endregion buffer

    public isDirtyMerkleRoot = true;

    public getMerkleRoot() {
        if (this.isDirtyMerkleRoot === false) {
            return this.merkleRootHash;
        }
        
        const listOfHashes: WBuffer[] = [];

        for (const frame of this.listOfCommands) {
            listOfHashes.push(
                sha256(frame.toBuffer())
            );
        }

        this.merkleRootHash = merkleCreateRoot(listOfHashes);
        this.isDirtyMerkleRoot = false;

        return this.merkleRootHash;
    }

    public addCommand(frame: Frame) {
        this.listOfCommands.push(frame);
        this.listOfCommands.sort((a, b) => WBuffer.compare(
            a.toBuffer('block'),
            b.toBuffer('block')
        ));
        this.value+= frame.data.value;
    }

    public getHash() {
        return doubleSha256(this.toBuffer('header'));
    }
}
