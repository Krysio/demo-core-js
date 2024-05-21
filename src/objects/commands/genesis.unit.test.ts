import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { GenesisCommand } from "./genesis";
import { KeySecp256k1 } from "@/objects/key";

const [privateKey, publicKey] = getKeyPair();
const key = new KeySecp256k1(publicKey);
const manifest = 'Content of manifest 😁';
const command = new GenesisCommand(key, [], manifest);

test('To & from buffer', () => {
    const buffer1 = command.toBuffer();

    command.parse(buffer1);

    expect(command.manifest).toBe(manifest);
    expect(command.rootPublicKey.isEqual(key)).toBe(true);

    const buffer2 = command.toBuffer();
    
    expect(buffer1.isEqual(buffer2)).toBe(true);
});
