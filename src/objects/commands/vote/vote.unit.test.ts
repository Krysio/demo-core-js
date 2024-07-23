import WBuffer from "@/libs/WBuffer";
import { createKey, createFakeNode } from "@/tests/helper";
import { ExFrame } from "@/objects/frame";
import { EMPTY_HASH } from "@/libs/crypto/sha256";
import { VoteCommand } from "./vote";

function createCommand({
    authorKey = createKey(),
    vottingHash = EMPTY_HASH,
    value = WBuffer.hex`00`,
} = {}) {
    const command = new VoteCommand(vottingHash, value);
    const frame = new ExFrame(command);

    frame.setAnchor(EMPTY_HASH);
    frame.addAuthor(authorKey)(authorKey.sign(frame.getHash()));

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
            storeVoter: { get: () => Promise.resolve(null) }
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
            storeVoter: { get: () => Promise.resolve(10) },
            storeVoting: { get: () => Promise.resolve(null) },
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

    describe('Time', () => {
        test('When voting timeStart is earlier than time of author add: should throw error', async () => {
            //#region Given
            const { command, frame } = createCommand();
            const fakeNode = createFakeNode({
                storeVoter: { get: () => Promise.resolve(10) },
                storeVoting: { get: () => Promise.resolve({ timeStart: 5 }) },
            });
            //#enregion Given

            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
        
            //#region Then
            .rejects.toThrow('Cmd: Vote: Author\'s key is too young');
            //#enregion Then
        });

        test('When voting has not started: should throw error', async () => {
            //#region Given
            const { command, frame } = createCommand();
            const fakeNode = createFakeNode({
                storeVoter: { get: () => Promise.resolve(10) },
                storeVoting: { get: () => Promise.resolve({ timeStart: 25 }) },
                chainTop: { getHeight: () => 20 },
            });
            //#enregion Given

            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
        
            //#region Then
            .rejects.toThrow('Cmd: Vote: Voting has not started');
            //#enregion Then
        });

        test('When voting is over: should throw error', async () => {
            //#region Given
            const { command, frame } = createCommand();
            const fakeNode = createFakeNode({
                storeVoter: { get: () => Promise.resolve(10) },
                storeVoting: { get: () => Promise.resolve({ timeStart: 25, timeEnd: 35 }) },
                chainTop: { getHeight: () => 40 },
            });
            //#enregion Given

            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
        
            //#region Then
            .rejects.toThrow('Cmd: Vote: Voting is over');
            //#enregion Then
        });
    });

    test('When vote value is invalid: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand({ value: WBuffer.hex`03` });
        const fakeNode = createFakeNode({
            storeVoter: { get: () => Promise.resolve(10) },
            storeVoting: { get: () => Promise.resolve({
                isValidValue: () => false,
                timeStart: 15,
                timeEnd: 25,
            }) },
            chainTop: { getHeight: () => 20 },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Vote: Invalid value');
        //#enregion Then
    });

    test('When everything is ok: should be ok', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeVoter: { get: () => Promise.resolve(10) },
            storeVoting: { get: () => Promise.resolve({
                isValidValue: () => true,
                timeStart: 15,
                timeEnd: 25,
            }) },
            chainTop: { getHeight: () => 20 },
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
