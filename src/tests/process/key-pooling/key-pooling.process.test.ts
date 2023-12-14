import { v4 as uuidv4 } from "uuid";
import WBuffer from "@/libs/WBuffer";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import PoolingProcess, { UserConnection } from "@/services/key-pooling";
import { KeySecp256k1 } from "@/objects/key";
import Client from "@/tests/process/key-pooling/client";
import { sha256 } from "@/libs/crypto/sha256";
import { isWaitForPerformanceObserver, mark, measure, printMeasures } from "@/performance";

const area = 0;
const countOfUsers = 16;
const countOfInterations = 5;
const listOfConnections: (UserConnection & { privateKey: WBuffer, signature: WBuffer, client: Client })[] = [];
const getHashOfPrevBlock = () => WBuffer.from(sha256(WBuffer.from(Math.random().toString())));

for (let i = 0; i < countOfUsers; i++) {
    const userID = WBuffer.from(uuidv4().replaceAll('-', ''));
    const signature = WBuffer.from([i]);
    const [privateKey, publicKey] = getKeyPair();
    const key = new KeySecp256k1(publicKey, privateKey);
    const client = new Client(userID, key, area);
    const api = client.getApi();

    listOfConnections.push({ userID, area, level: 0, privateKey, key, signature, api, client });
}

listOfConnections.sort((a, b) => a.userID === b.userID ? 0 : a.userID < b.userID ? -1 : 1);

const process = new PoolingProcess(area, listOfConnections, countOfInterations, getHashOfPrevBlock);

test(`Test prcoess of key-pooling with ${countOfUsers} clients`, async () => {
    await process.run();

    expect(process.command.isValid()).toBe(true);

    const hash = process.command.getHash();

    mark`start:verifySignatures`;

    for (const { userID, signature } of process.command.getSignatureInterator()) {
        const { key } = listOfConnections.find((connection) => connection.userID.isEqual(userID));

        expect(key.verify(hash, signature)).toBe(true);
    }

    mark`end:verifySignatures`;
    measure('verifySignatures', 'start:verifySignatures', 'end:verifySignatures');
});

test('printMeasures', (done) => {
    if (isWaitForPerformanceObserver) {
        setTimeout(() => {
            printMeasures();
            done();
        }, 10);
    } else done();
});
