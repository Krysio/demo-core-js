import { createFakeNode, createKey } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { DelVoterCommand } from "./del-voter";
import { Key } from "../key";

function createCommand({
    reason = '',
    flags = 0,
    countOfAuthors = 2,
    nextCadency = false
} = {}) {
    const voterKey = createKey();
    const command = new DelVoterCommand(voterKey, reason, flags);
    const frame = new Frame(command);
    const listOfAuthorKey: Key[] = [];

    command.setNextCadency(nextCadency);

    for (let i = 0; i < countOfAuthors; i++) {
        listOfAuthorKey.push(createKey());
    }

    frame.setAnchor(0);
    listOfAuthorKey
        .map((authorKey) => ({
            authorKey,
            setSignature: frame.addAuthor(authorKey)
        }))
        .forEach(({ authorKey, setSignature }) => {
            setSignature(authorKey.sign(frame.getHash()));
        });

    return { frame, command, listOfAuthorKey };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new DelVoterCommand().parse(bufferA).toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});

describe('Verifivation', () => {
    test('When count of authors are less than 2: should throw error', async () => {
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
