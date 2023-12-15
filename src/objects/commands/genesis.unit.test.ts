import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import GenesisCommand from "./genesis";
import { KeySecp256k1 } from "../key";

const [privateKey, publicKey] = getKeyPair();
const key = new KeySecp256k1(publicKey);
const command = new GenesisCommand(key, [], 'Content of manifest 😁');

test('To & from buffer', () => {
    const buffer1 = command.toBuffer();
    const hash1 = command.getHash();

    command.fromBuffer(buffer1);

    const buffer2 = command.toBuffer();
    const hash2 = command.getHash();
    
    expect(buffer1.isEqual(buffer2)).toBe(true);
    expect(hash1.isEqual(hash2)).toBe(true);
});
