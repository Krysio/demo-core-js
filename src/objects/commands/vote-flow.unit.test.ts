import { createFakeNode, createKey } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { sha256, EMPTY_HASH } from "@/libs/crypto/sha256";
import { FlowVoteCommand } from "./vote-flow";

function createCommand({
    authorKey = createKey(),
    vottingHash = EMPTY_HASH,
    key = createKey(),
} = {}) {
    const command = new FlowVoteCommand(vottingHash, key);
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
    const { frame } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = frame.toBuffer();
    const bufferB = Frame.parse(bufferA).toBuffer();
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
        .rejects.toThrow('Cmd: Vote-flow: Author does not exist');
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
        .rejects.toThrow('Cmd: Vote-flow: Voting does not exist');
        //#enregion Then
    });

    test('When voting do not allow for flow: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeVoter: { get: () => Promise.resolve(10) },
            storeVoting: { get: () => Promise.resolve({
                isAllowFlow: false
            }) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Vote-flow: Voting do not allow for flow-votes');
        //#enregion Then
    });

    describe('Time', () => {
        test('When voting timeStart is earlier than time of author add: should throw error', async () => {
            //#region Given
            const { command, frame } = createCommand();
            const fakeNode = createFakeNode({
                storeVoter: { get: () => Promise.resolve(10) },
                storeVoting: { get: () => Promise.resolve({
                    isAllowFlow: true,
                    timeStart: 5,
                }) },
            });
            //#enregion Given

            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
        
            //#region Then
            .rejects.toThrow('Cmd: Vote-flow: Author\'s key is too young');
            //#enregion Then
        });

        test('When voting has not started: should throw error', async () => {
            //#region Given
            const { command, frame } = createCommand();
            const fakeNode = createFakeNode({
                storeVoter: { get: () => Promise.resolve(10) },
                storeVoting: { get: () => Promise.resolve({
                    isAllowFlow: true,
                    timeStart: 25,
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
            .rejects.toThrow('Cmd: Vote-flow: Voting has not started');
            //#enregion Then
        });

        test('When voting is over: should throw error', async () => {
            //#region Given
            const { command, frame } = createCommand();
            const fakeNode = createFakeNode({
                storeVoter: { get: () => Promise.resolve(10) },
                storeVoting: { get: () => Promise.resolve({
                    isAllowFlow: true,
                    timeStart: 25,
                    timeEnd: 35,
                }) },
                chainTop: { getHeight: () => 40 },
            });
            //#enregion Given

            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
        
            //#region Then
            .rejects.toThrow('Cmd: Vote-flow: Voting is over');
            //#enregion Then
        });
    });

    test('When target key is out of the store: should throw error', async () => {
        //#region Given
        const { command, frame, authorKey } = createCommand();
        const fakeNode = createFakeNode({
            storeVoter: {
                get: jest.fn((key) => {
                    if (authorKey.toBuffer().isEqual(key.toBuffer())) return Promise.resolve(10);
                    return Promise.resolve(null);
                }),
            },
            storeVoting: { get: jest.fn(() => Promise.resolve({
                isAllowFlow: true,
                timeStart: 15,
            })) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Vote-flow: Target voter account does not exist');
        //#enregion Then
    });

    test('When everything is ok: should be ok', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeVoter: { get: () => Promise.resolve(10) },
            storeVoting: { get: () => Promise.resolve({
                isAllowFlow: true,
                timeStart: 25,
                timeEnd: 35,
            }) },
            chainTop: { getHeight: () => 30 },
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
