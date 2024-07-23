import { createFakeNode, createKey } from "@/tests/helper";
import { ExFrame } from "@/objects/frame";
import { ExKeyPoolingCommand } from "./key-pooling";

function createCommand({
    flags = 0
} = {}) {
    const command = new ExKeyPoolingCommand({ flags });
    const frame = new ExFrame(command);
    const listOfAuthorsKeys = [];
    const listOfNewKeys = [];

    frame.setAnchor(0);

    for (let i = 0; i < 4; i++) {
        const authorKey = createKey();
        const newKey = createKey();

        listOfAuthorsKeys.push(authorKey);
        listOfNewKeys.push(newKey);
    }

    listOfNewKeys.forEach((newKey) => {
        command.addPublicKey(newKey);
    });
    listOfAuthorsKeys.forEach((authorKey) => {
        frame.addAuthor(authorKey);
    });
    listOfAuthorsKeys.forEach((authorKey) => {
        frame.addSignature(authorKey, authorKey.sign(frame.getHash()));
    });

    return { frame, command, listOfAuthorsKeys, listOfNewKeys };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new ExKeyPoolingCommand().parse(bufferA).toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});

describe('Verifivation', () => {
    describe('For the current cadency', () => {
        test('Test flag', () => {
            //#region Given
            const { command } = createCommand({ flags: 0 });
            //#enregion Given

            //#region When & Then
            expect(command.isNextCadency()).toBe(false);
            //#enregion When & Then
        });
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
    describe('For the next cadency', () => {
        test('Test flag', () => {
            //#region Given
            const { command } = createCommand({ flags: 1 });
            //#enregion Given

            //#region When & Then
            expect(command.isNextCadency()).toBe(true);
            //#enregion When & Then
        });
        test('When author is out of the store: should throw error', async () => {
            //#region Given
            const { command, frame } = createCommand({ flags: 1 });
            const fakeNode = createFakeNode({
                storeVoter: { getNext: () => Promise.resolve(null)}
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
            const { command, frame } = createCommand({ flags: 1 });
            const iterStoreVoterGet = (function* (){
                for (let i = 0; i < 4; i++) yield Promise.resolve({});
                for (let i = 0; i < 4; i++) yield Promise.resolve(null);
            })();
            const fakeNode = createFakeNode({
                storeVoter: {
                    getNext: () => iterStoreVoterGet.next().value,
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
            const { command, frame } = createCommand({ flags: 1 });
            const fakeNode = createFakeNode({
                storeVoter: { getNext: () => Promise.resolve({})}
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
});
