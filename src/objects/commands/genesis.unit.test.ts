import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { GenesisCommand } from "./genesis";
import { KeySecp256k1 } from "@/objects/key";

test('To & from buffer should result the same data', () => {
    //#region Given
    const [privateKey, publicKey] = getKeyPair();
    const key = new KeySecp256k1(publicKey);
    const manifest = 'Content of manifest 😁';
    const command = new GenesisCommand(key, [], manifest);
    //#enregion Given

    //#region When
    const buffer1 = command.toBuffer();
    const buffer2 = new GenesisCommand().parse(buffer1).toBuffer();
    //#enregion When

    //#region Then
    expect(command.manifest).toBe(manifest);
    expect(command.rootPublicKey.isEqual(key)).toBe(true);
    expect(buffer1.isEqual(buffer2)).toBe(true);
    //#enregion Then
});
