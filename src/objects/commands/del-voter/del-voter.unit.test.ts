import { createFakeNode, createKey } from "@/tests/helper";
import { ExFrame } from "@/objects/frame";
import { ExDelVoterCommand } from "./del-voter";
import { Key } from "@/objects/key";

function createCommand({
    reason = '',
    countOfAuthors = 2,
    nextCadency = false
} = {}) {
    const voterKey = createKey();
    const command = new ExDelVoterCommand(voterKey, reason);
    const frame = new ExFrame(command);
    const listOfAuthorsKey: Key[] = [];

    command.setNextCadency(nextCadency);

    for (let i = 0; i < countOfAuthors; i++) {
        listOfAuthorsKey.push(createKey());
    }

    frame.setAnchor(0);
    listOfAuthorsKey.forEach((publicKey) => {
        frame.addAuthor(publicKey);
    });
    listOfAuthorsKey.forEach((publicKey) => {
        frame.addSignature(publicKey, publicKey.sign(frame.getHash()));
    });

    return { frame, command, listOfAuthorsKey };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new ExDelVoterCommand().parse(bufferA).toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});

describe('Verifivation', () => {
    test('When count of authors are less than a rule value: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand({countOfAuthors: 1});
        const fakeNode = createFakeNode();
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del Voter: Too few authors');
        //#enregion Then
    });

    test('When author is out of the store: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: { get: () => Promise.resolve(null) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del Voter: Author does not exist');
        //#enregion Then
    });

    test('When author\'s level is too hight: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: { get: () => Promise.resolve({ level: 3 }) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del Voter: One of author have no perrmisions');
        //#enregion Then
    });

    test('When voter is out of the store of the current cadency: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: { get: () => Promise.resolve({}) },
            storeVoter: { get: () => Promise.resolve(null) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del Voter: Voter not found');
        //#enregion Then
    });

    test('When voter is out of the store of the next cadency: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand({ nextCadency: true });
        const fakeNode = createFakeNode({
            storeAdmin: { get: () => Promise.resolve({}) },
            storeVoter: { getNext: () => Promise.resolve(null) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del Voter: Voter not found');
        //#enregion Then
    });
});
