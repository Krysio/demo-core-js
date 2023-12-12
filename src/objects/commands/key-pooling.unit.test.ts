import { v4 as uuidv4 } from "uuid";
import KeyPoolingCommand from "./key-pooling";
import WBuffer from "@/libs/WBuffer";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { KeySecp256k1 } from "@/objects/key";
import { EMPTY_HASH } from "@/libs/crypto/sha256";

const command = new KeyPoolingCommand();
const listOfAuthors: {
    userID: WBuffer,
    signature: WBuffer,
    privateKey: WBuffer,
    publicKey: WBuffer
}[] = [];
const countOfAuthors = 16;
const area = 200;

for (let i = 0; i < countOfAuthors; i++) {
    const userID = WBuffer.from(uuidv4().replaceAll('-', ''));
    const signature = WBuffer.from([i]);
    const [privateKey, publicKey] = getKeyPair();
    const keySecp256k1 = new KeySecp256k1();

    keySecp256k1.key = publicKey;
    listOfAuthors.push({ userID, signature, privateKey, publicKey });
    command.addAuthor(userID, signature);
    command.addPublicKey(keySecp256k1);
}

listOfAuthors.sort((a, b) => a.userID === b.userID ? 0 : a.userID < b.userID ? -1 : 1);
command.addArea(area);
command.hashOfPrevBlock = EMPTY_HASH;

test('Signature interator', () => {
    let i = 0;
    for (const {userID, signature} of command.getSignatureInterator()) {
        expect(userID).toBe(listOfAuthors[i].userID);
        expect(WBuffer.compare(signature, listOfAuthors[i].signature)).toBe(0);
        i++;
    }
    expect(i).toBe(countOfAuthors);
});

test('To & from buffer', () => {
    const buffer1 = command.toBuffer();
    command.fromBuffer(buffer1);
    const buffer2 = command.toBuffer();
    
    expect(WBuffer.compare(buffer1, buffer2)).toBe(0);
});
