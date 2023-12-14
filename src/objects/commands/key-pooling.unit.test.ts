import { v4 as uuidv4 } from "uuid";
import KeyPoolingCommand from "./key-pooling";
import WBuffer from "@/libs/WBuffer";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import Key, { KeySecp256k1 } from "@/objects/key";
import { sha256 } from "@/libs/crypto/sha256";

const command = new KeyPoolingCommand();
const listOfAuthors: {
    userID: WBuffer,
    signature: WBuffer,
    key: Key
}[] = [];
const countOfAuthors = 16;
const area = 200;
const hashOfPrevBlock = sha256(WBuffer.from(Math.random().toString()));

command.addArea(area);
command.hashOfPrevBlock = hashOfPrevBlock;

for (let i = 0; i < countOfAuthors; i++) {
    const userID = WBuffer.from(uuidv4().replaceAll('-', ''), 'hex');
    const [privateKey, publicKey] = getKeyPair();
    const key = new KeySecp256k1(publicKey, privateKey);

    listOfAuthors.push({ userID, signature: null, key });
    command.addAuthor(userID);
    command.addPublicKey(key);
}

listOfAuthors.sort((a, b) => WBuffer.compare(a.userID, b.userID));

test('To & from buffer without signatures', () => {
    const buffer1 = command.toBuffer();
    const hash1 = command.getHash();
    command.fromBuffer(buffer1);
    const buffer2 = command.toBuffer();
    const hash2 = command.getHash();
    
    expect(buffer1).not.toBe(null);
    expect(buffer2).not.toBe(null);
    expect(command.hashOfPrevBlock.length).toBe(32);
    expect(buffer1.isEqual(buffer2)).toBe(true);
    expect(hash1.isEqual(hash2)).toBe(true);
});

const hash = command.getHash();

for (const { userID } of command.getSignatureInterator()) {
    for (const item of listOfAuthors) {
        if (userID.isEqual(item.userID)) {
            const signature = item.key.sign(hash);

            item.signature = signature;
            command.addAuthor(userID, signature);
        }
    }
}

test('Signature interator', () => {
    let i = 0;
    for (const {userID, signature} of command.getSignatureInterator()) {
        for (const item of listOfAuthors) {
            if (userID.isEqual(item.userID)) {
                expect(userID.length).toBe(16);
                expect(signature.isEqual(item.signature)).toBe(true);
                expect(item.key.verify(hash, signature)).toBe(true);
            }
        }
        i++;
    }
    expect(i).toBe(countOfAuthors);
});

test('To & from buffer with signatures', () => {
    const buffer1 = command.toBuffer();
    const hash1 = command.getHash();
    command.fromBuffer(buffer1);
    const buffer2 = command.toBuffer();
    const hash2 = command.getHash();
    
    expect(buffer1).not.toBe(null);
    expect(buffer2).not.toBe(null);
    expect(command.hashOfPrevBlock.length).toBe(32);
    expect(buffer1.isEqual(buffer2)).toBe(true);
    expect(hash.isEqual(hash1)).toBe(true);
    expect(hash1.isEqual(hash2)).toBe(true);
});
