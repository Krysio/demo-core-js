import { createFakeNode, createKey } from "@/tests/helper";
import { ExFrame } from "@/objects/frame";
import { Admin } from "@/objects/users";
import { VotingSimple } from "@/objects/voting";
import { SetVotingCommand } from "./set-voting";
import { BHTime } from "@/modules/time";

function createCommand({
    authorKey = createKey(),
    meta = ''
} = {}) {
    const voting = new VotingSimple(10 as BHTime, 1000 as BHTime, meta);
    const command = new SetVotingCommand(voting);
    const frame = new ExFrame(command);
    const author = new Admin(authorKey);

    frame.setAnchor(0);
    frame.addAuthor(authorKey)(authorKey.sign(frame.getHash()));

    return { frame, command, author };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new SetVotingCommand().parse(bufferA).toBuffer();
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
        .rejects.toThrow('Cmd: Set Voting: Author does not exist');
        //#enregion Then
    });

    test('When command author is in the store: should do not throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: { get: jest.fn(() => Promise.resolve({})) },
            storeVoting: { get: jest.fn(() => Promise.resolve(null)) },
            time: { isPeriodBreak: () => false },
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
            time: { isPeriodBreak: () => false },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Set Voting: Duplicate voting hash');
        //#enregion Then
    });

    test('When the voting period does not within a single cadency: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: { get: jest.fn(() => Promise.resolve({})) },
            storeVoting: { get: jest.fn(() => Promise.resolve(null)) },
            time: { isPeriodBreak: () => true },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Set Voting: Invalid voting period');
        //#enregion Then
    });
});
