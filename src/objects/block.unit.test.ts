import { EMPTY_HASH } from "@/libs/crypto/sha256";
import { Block } from "./Block";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { GenesisCommand } from "./commands/genesis";
import { KeySecp256k1 } from "./key";
import { Frame } from "./frame";

test('To & from buffer should result the same data', () => {
    //#region Given
    const block1 = new Block();

    block1.hashOfPrevBlock = EMPTY_HASH;

    const [privateKey, publicKey] = getKeyPair();
    const key = new KeySecp256k1(publicKey);
    const genesisCommand = new GenesisCommand(key);
    const frame = new Frame(genesisCommand);

    block1.addCommand(frame);
    //#enregion Given

    //#region When
    const buffer1 = block1.toBuffer();
    const hash1 = block1.getHash();
    const block2 = new Block().parse(buffer1);
    const buffer2 = block2.toBuffer();
    const hash2 = block1.getHash();
    //#enregion When

    //#region Then
    expect(block2.index).toBe(0);
    expect(block2.hashOfPrevBlock.isEqual(EMPTY_HASH)).toBe(true);
    expect(block2.listOfCommands.length).toBe(1);
    expect(block2.getPrimaryValue()).toBe(1);
    expect(block2.getSecondaryValue()).toBe(0);
    expect(buffer1.isEqual(buffer2)).toBe(true);
    expect(hash1.isEqual(hash2)).toBe(true);
    //#enregion Then
});
