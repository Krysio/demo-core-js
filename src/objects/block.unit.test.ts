import { EMPTY_HASH } from "@/libs/crypto/sha256";
import Block from "./block";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import GenesisCommand from "./commands/genesis";
import { KeySecp256k1 } from "./key";

const block = new Block();
const [privateKey, publicKey] = getKeyPair();
const key = new KeySecp256k1(publicKey);
const genesisCommand = new GenesisCommand(key);

block.hashOfPrevBlock = EMPTY_HASH;
block.addCommand(genesisCommand);

test('To & from buffer', () => {
    const buffer1 = block.toBuffer();
    const hash1 = block.getHash();

    block.fromBuffer(buffer1);

    const buffer2 = block.toBuffer();
    const hash2 = block.getHash();
    
    expect(buffer1.isEqual(buffer2)).toBe(true);
    expect(hash1.isEqual(hash2)).toBe(true);
});
