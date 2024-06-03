import { EMPTY_HASH } from "@/libs/crypto/sha256";
import { Block } from "./Block";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { GenesisCommand } from "./commands";
import { KeySecp256k1 } from "./key";
import { Frame } from "./frame";

const block = new Block();
const [privateKey, publicKey] = getKeyPair();
const key = new KeySecp256k1(publicKey);
const genesisCommand = new GenesisCommand(key);

block.hashOfPrevBlock = EMPTY_HASH;

const frame = new Frame(genesisCommand);

block.addCommand(frame);

test('To & from buffer', () => {
    const buffer1 = block.toBuffer();
    const hash1 = block.getHash();

    block.parse(buffer1);

    expect(block.index).toBe(0);
    expect(block.hashOfPrevBlock.isEqual(EMPTY_HASH)).toBe(true);
    expect(block.listOfCommands.length).toBe(1);
    expect(block.getPrimaryValue()).toBe(1);
    expect(block.getSecondaryValue()).toBe(0);

    const buffer2 = block.toBuffer();
    const hash2 = block.getHash();
    
    expect(buffer1.isEqual(buffer2)).toBe(true);
    expect(hash1.isEqual(hash2)).toBe(true);
});
