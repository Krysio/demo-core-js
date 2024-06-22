import { createFakeNode, createKey } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { Admin } from "@/objects/users";
import { VotingSimple } from "@/objects/voting";
import { sha256 } from "@/libs/crypto/sha256";
import { AddVotingCommand } from "./add-voting";

function createCommand({
    authorKey = createKey(),
    meta = ''
} = {}) {
    const voting = new VotingSimple(10, 1000, meta);
    const command = new AddVotingCommand(voting);
    const frame = new Frame(command);
    const author = new Admin(authorKey);

    frame.anchorIndex = 0;
    frame.authors.push({
        publicKey: authorKey,
        signature: null
    });

    frame.authors[0].signature = authorKey.sign(
        sha256(frame.toBuffer('hash'))
    );

    return { frame, command, author };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new AddVotingCommand().parse(bufferA).toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});

describe('Verifivation', () => {
    test('When command author is out of the store: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: { get: jest.fn(() => Promise.resolve(null)) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Add Voting: Author does not exist');
        //#enregion Then
    });

    test('When command author is in the store: should do not throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: { get: jest.fn(() => Promise.resolve({})) },
            storeVoting: { get: jest.fn(() => Promise.resolve(null)) },
            cadency: { isPeriodBreak: () => false },
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

    test('When the voting hash is in the store: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: { get: jest.fn(() => Promise.resolve({})) },
            storeVoting: { get: jest.fn(() => Promise.resolve({})) },
            cadency: { isPeriodBreak: () => false },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Add Voting: Duplicate voting hash');
        //#enregion Then
    });

    test('When the voting period does not within a single cadency: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: { get: jest.fn(() => Promise.resolve({})) },
            storeVoting: { get: jest.fn(() => Promise.resolve(null)) },
            cadency: { isPeriodBreak: () => true },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Add Voting: Invalid voting period');
        //#enregion Then
    });
});
