import { v4 as uuidv4 } from "uuid";
import WBuffer from "@/libs/WBuffer";
import { getKeyPair, verify as verifySignature } from "@/libs/crypto/ec/secp256k1";
import PoolingProcess, { UserConnection } from "@/services/key-pooling";
import { KeySecp256k1 } from "@/objects/key";
import Client from "@/tests/process/key-pooling/client";
import { sha256 } from "@/libs/crypto/sha256";

describe('Test with 4 clients', () => {
    const countOfUsers = 4;
    const listOfConnections: (UserConnection & {privateKey: WBuffer, signature: WBuffer, client: Client})[] = [];
    const area = 0;
    const countOfInterations = 5;
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

    test('Create list', () => {
        const result = process.createListOfUsers();

        expect(result.length).toBe(countOfUsers * 2);

        for (let i = 0; i < result.length ; i+=2) {
            expect(WBuffer.isEqual(result[i + 0], listOfConnections[i / 2].userID)).toBe(true);
            expect(WBuffer.isEqual(result[i + 1], listOfConnections[i / 2].key.toBuffer())).toBe(true);
        }
    });

    test('Consume message pack', () => {
        const listOfMessages: WBuffer[] = [];

        for (let i = 0; i < countOfUsers; i++) {
            listOfMessages.push(WBuffer.concat([
                listOfConnections[i].userID,
                WBuffer.uleb128(listOfConnections[i].userID.length),
                listOfConnections[i].userID
            ]));
        }

        expect(() => {
            process.consumeMessagePack(WBuffer.concat([
                WBuffer.uleb128(listOfMessages.length),
                ...listOfMessages
            ]));
        }).not.toThrow();

        for (let i = 0; i < countOfUsers; i++) {
            const keyOfMap = listOfConnections[i].userID.toString('hex');
            const listOfMessages = process.mapOfMessages.get(keyOfMap);

            expect(listOfMessages.length).toBe(1);
            expect(WBuffer.compare(listOfMessages[0], listOfConnections[i].userID)).toBe(0);
        }
    });

    test('Consume pack of keys', () => {
        const listOfKeys: KeySecp256k1[] = [];
        const isNotFakeFlag = WBuffer.hex`01`;

        for (let i = 0; i < countOfUsers; i++) {
            const [, publicKey] = getKeyPair();
            const key = new KeySecp256k1(publicKey);

            listOfKeys.push(key);
        }
        
        expect(() => {
            process.consumeKeyPack(WBuffer.concat([
                WBuffer.uleb128(listOfKeys.length),
                ...listOfKeys.map((key) => WBuffer.concat([
                    isNotFakeFlag,
                    key.toBuffer()
                ]))
            ]));
        }).not.toThrow();

        expect(process.command.listOfPublicKeys.length).toBe(countOfUsers);

        for (let i = 0; i < countOfUsers; i++) {
            const keyFromPool = process.command.listOfPublicKeys[i];

            expect(listOfKeys.filter((key) => 
                key.typeID == keyFromPool.typeID
                && WBuffer.isEqual(key.key, keyFromPool.key)
            ).length).toBe(1);
        }
    });
});
