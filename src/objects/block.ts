import WBuffer from "@/libs/WBuffer";
import { doubleSha256, sha256, EMPTY_HASH } from "@/libs/crypto/sha256";
import { merkleCreateRoot } from "@/libs/merkle";
import { Frame } from "@/objects/frame";
import { TYPE_VALUE_PRIMARY, TYPE_VALUE_SECONDARY } from "./commands";

const VERSION = 1;

export class Block {
    public version = VERSION;
    public index = 0;
    public hashOfPrevBlock: WBuffer = EMPTY_HASH;
    public merkleRootHash: WBuffer = EMPTY_HASH;
    public primaryValue = 0;
    public secondaryValue = 0;
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
        this.primaryValue = buffer.readUleb128();
        this.secondaryValue = buffer.readUleb128();
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
        const primaryValue = WBuffer.uleb128(this.getPrimaryValue());
        const secondaryValue = WBuffer.uleb128(this.getSecondaryValue());

        return WBuffer.concat([
            version,
            index,
            this.hashOfPrevBlock,
            merkleRootHash,
            primaryValue,
            secondaryValue,
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
    public isDirtyPrimaryValue = true;
    public isDirtySecondaryValue = true;

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

        switch (frame.data.valueTypeID) {
            case TYPE_VALUE_PRIMARY: {
                this.isDirtyPrimaryValue = true;
            } break;
            case TYPE_VALUE_SECONDARY: {
                this.isDirtySecondaryValue = true;
            } break;
        }
    }

    public getHash() {
        return doubleSha256(this.toBuffer('header'));
    }

    public getPrimaryValue(): number {
        if (this.isDirtyPrimaryValue === false) {
            return this.primaryValue;
        }

        const mapOfKeys: {[key: string]: 1} = {};

        for (const frame of this.listOfCommands) {
            if (frame.data.valueTypeID === TYPE_VALUE_PRIMARY) {
                const key = frame.getKeyOfValue().hex();

                mapOfKeys[key] = 1;
            }
        }

        this.primaryValue = Object.values(mapOfKeys).length;
        this.isDirtyPrimaryValue = false;

        return this.primaryValue;
    }

    public getSecondaryValue(): number {
        if (this.isDirtySecondaryValue === false) {
            return this.secondaryValue;
        }

        const mapOfKeys: {[key: string]: 1} = {};

        for (const frame of this.listOfCommands) {
            if (frame.data.valueTypeID === TYPE_VALUE_SECONDARY) {
                const key = frame.getKeyOfValue().hex();

                mapOfKeys[key] = 1;
            }
        }

        this.secondaryValue = Object.values(mapOfKeys).length;
        this.isDirtySecondaryValue = false;

        return this.secondaryValue;
    }
}
