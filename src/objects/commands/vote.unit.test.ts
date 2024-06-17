import WBuffer from "@/libs/WBuffer";
import { createKey, createFakeNode } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { sha256, EMPTY_HASH } from "@/libs/crypto/sha256";
import { VoteCommand } from "./vote";

function createCommand({
    authorKey = createKey(),
    vottingHash = EMPTY_HASH,
    value = WBuffer.hex`00`,
} = {}) {
    const command = new VoteCommand(vottingHash, value);
    const frame = new Frame(command);

    frame.anchorHash = EMPTY_HASH;
    frame.authors.push({
        publicKey: authorKey,
        signature: null
    });

    frame.authors[0].signature = authorKey.sign(
        sha256(frame.toBuffer('hash'))
    );

    return { frame, command, authorKey };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new VoteCommand().parse(bufferA).toBuffer();
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
            storeVoter: { get: jest.fn(() => Promise.resolve(null)) }
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Vote: Author does not exist');
        //#enregion Then
    });

    test('When voting hash is out of the store: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeVoter: { get: jest.fn(() => Promise.resolve({})) },
            storeVoting: { get: jest.fn(() => Promise.resolve(null)) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Vote: Voting does not exist');
        //#enregion Then
    });

    test('When everything is ok: should be ok', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeVoter: { get: jest.fn(() => Promise.resolve({})) },
            storeVoting: { get: jest.fn(() => Promise.resolve({})) },
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
});
