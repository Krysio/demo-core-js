import { createKey, createFakeNode } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { ActivateUserCommand } from "./activate-user";

function createCommand({
    value = 0,
    authorKey = createKey(),
    anchor = 10,
} = {}) {
    const command = new ActivateUserCommand(value);
    const frame = new Frame(command);

    frame.setAnchor(anchor);
    frame.addAuthor(authorKey)(authorKey.sign(frame.getHash()));

    return { frame, command, authorKey };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new ActivateUserCommand().parse(bufferA).toBuffer();
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
            storeUser: { get: () => Promise.resolve(null) },
        });
        //#enregion Given

        //#region When
        const result = await expect((async () => {
            await command.verify(fakeNode, frame);
        })());
        //#enregion When
    
        //#region Then
        result.rejects.toThrow('Cmd: Activate User: Author does not exist');
        //#enregion Then
    });

    test('When author is in the store: should do not throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeUser: { get: () => Promise.resolve({
                timeStart: 10,
                timeEnd: 100,
                isActivationLocked: () => false,
            }) },
            storeVoter: { get: () => Promise.resolve(null) },
        });
        //#enregion Given

        //#region When
        const result = await expect((async () => {
            await command.verify(fakeNode, frame);
        })());
        //#enregion When
    
        //#region Then
        result.resolves.not.toThrow();
        //#enregion Then
    });

    test('When author is locked: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeUser: { get: () => Promise.resolve({
                timeStart: 10,
                timeEnd: 100,
                isActivationLocked: () => true,
            }) },
            storeVoter: { get: () => Promise.resolve(null) },
        });
        //#enregion Given

        //#region When
        const result = await expect((async () => {
            await command.verify(fakeNode, frame);
        })());
        //#enregion When
    
        //#region Then
        result.rejects.toThrow('Cmd: Activate User: Account locked');
        //#enregion Then
    });

    test('When action is too early: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand({ anchor: 5 });
        const fakeNode = createFakeNode({
            storeUser: { get: () => Promise.resolve({
                timeStart: 10,
                timeEnd: 100,
                isActivationLocked: () => false,
            }) },
        });
        //#enregion Given

        //#region When
        const result = await expect((async () => {
            await command.verify(fakeNode, frame);
        })());
        //#enregion When

        //#region Then
        result.rejects.toThrow('Cmd: Activate User: Action induced too early');
        //#enregion Then
    });

    test('When user account is already active: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand({ anchor: 25 });
        const fakeNode = createFakeNode({
            storeUser: { get: () => Promise.resolve({
                timeStart: 10,
                timeEnd: 100,
                isActivationLocked: () => false,
            }) },
            storeVoter: { get: () => Promise.resolve(1) },
        });
        //#enregion Given

        //#region When
        const result = await expect((async () => {
            await command.verify(fakeNode, frame);
        })());
        //#enregion When

        //#region Then
        result.rejects.toThrow('Cmd: Activate User: Duplicate key');
        //#enregion Then
    });

    test('When user account is expired: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand({ anchor: 105 });
        const fakeNode = createFakeNode({
            storeUser: { get: () => Promise.resolve({
                timeStart: 10,
                timeEnd: 100,
                isActivationLocked: () => false,
            }) },
        });
        //#enregion Given

        //#region When
        const result = await expect((async () => {
            await command.verify(fakeNode, frame);
        })());
        //#enregion When

        //#region Then
        result.rejects.toThrow('Cmd: Activate User: Account expired');
        //#enregion Then
    });
});
