import { createFakeNode, createKey } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { KeyPoolingCommand } from "./key-pooling";

function createCommand({} = {}) {
    const command = new KeyPoolingCommand();
    const frame = new Frame(command);
    const listOfAuthors = [];
    const listOfKeys = [];

    frame.anchorIndex = 0;

    for (let i = 0; i < 4; i++) {
        const authorKey = createKey();
        const newKey = createKey();

        listOfAuthors.push(authorKey);
        listOfKeys.push(newKey);
        command.addPublicKey(newKey);
        frame.authors.push({
            publicKey: authorKey,
            signature: null
        });
    }

    return { frame, command, listOfAuthors, listOfKeys };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new KeyPoolingCommand().parse(bufferA).toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});

describe('Verifivation', () => {
    test('When author is out of the store: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeVoter: { get: () => Promise.resolve(null)}
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Key-pooling: One of authors does not exist');
        //#enregion Then
    });

    test('When author is in the store: should do not throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const iterStoreVoterGet = (function* (){
            for (let i = 0; i < 4; i++) yield Promise.resolve({});
            for (let i = 0; i < 4; i++) yield Promise.resolve(null);
        })();
        const fakeNode = createFakeNode({
            storeVoter: {
                get: () => iterStoreVoterGet.next().value,
            }
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .resolves.not.toThrow();
        //#enregion Then
    });

    test('When inserting key is in the store: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeVoter: { get: () => Promise.resolve({})}
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Key-pooling: Duplicate key');
        //#enregion Then
    });
});
