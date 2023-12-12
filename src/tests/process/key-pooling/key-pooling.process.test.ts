import { v4 as uuidv4 } from "uuid";
import WBuffer from "@/libs/WBuffer";
import { getKeyPair, verify as verifySignature } from "@/libs/crypto/ec/secp256k1";
import PoolingProcess, { UserConnection } from "@/services/key-pooling";
import { KeySecp256k1 } from "@/objects/key";
import Client from "@/tests/process/key-pooling/client";

describe('Test with 4 clients', () => {
    const countOfUsers = 4;
    const listOfConnections: (UserConnection & {privateKey: WBuffer, signature: WBuffer, client: Client})[] = [];
    const area = 0;
    const countOfInterations = 5;

    for (let i = 0; i < countOfUsers; i++) {
        const userID = WBuffer.from(uuidv4().replaceAll('-', ''));
        const signature = WBuffer.from([i]);
        const [privateKey, publicKey] = getKeyPair();
        const key = new KeySecp256k1();
        const client = new Client(userID, privateKey, publicKey);
        const api = client.getApi();

        key.key = publicKey;
        listOfConnections.push({ userID, area, level: 0, privateKey, key, signature, api, client });
    }

    listOfConnections.sort((a, b) => a.userID === b.userID ? 0 : a.userID < b.userID ? -1 : 1);

    const process = new PoolingProcess(area, listOfConnections, countOfInterations);

    test('Process', async () => {
        await process.run();
    
        const commandHash = process.command.getHash();
    
        expect(process.command.isValid()).toBe(true);
    
        for (const { userID, signature } of process.command.getSignatureInterator()) {
            const { key } = listOfConnections.find((connection) => connection.userID === userID);
    
            expect(verifySignature(key.key, commandHash, signature)).toBe(true);
        }
    });
});
