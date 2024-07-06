import { createFakeNode, createKey, createUser } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { Admin } from "@/objects/users";
import { sha256 } from "@/libs/crypto/sha256";
import { SetUserCommand } from "./set-user";
import { BHTime } from "@/modules/time";

function createCommand({
    user = createUser(),
    authorKey = createKey(),
} = {}) {
    const command = new SetUserCommand(user.user);
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

    return { frame, command, author, user };
}

const storeAdminWithNoAdmin = { get: () => Promise.resolve(null)};
const storeAdminWithAdmin = { get: () => Promise.resolve({})};
const storeUserWithNoUser = { get: () => Promise.resolve(null)};
const storeUserWithUser = { get: () => Promise.resolve({})};
const fakeNodeDefaults = {
    storeAdmin: storeAdminWithAdmin,
    storeUser: storeUserWithNoUser,
    config: {
        timeBeforeAccountActivation: 5,
        timeLiveOfUserAccount: 10000,
    },
};

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new SetUserCommand().parse(bufferA).toBuffer();
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
            ...fakeNodeDefaults,
            storeAdmin: storeAdminWithNoAdmin
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Set User: Author does not exist');
        //#enregion Then
    });

    test('When author is in the store: should do not throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode(fakeNodeDefaults);
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
            ...fakeNodeDefaults,
            storeUser: storeUserWithUser
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Set User: Duplicate key');
        //#enregion Then
    });

    describe('Time values', () => {
        test('When the field timeStart is too low: should throw error', async () => {
            //#region Given
            const { command, frame, user } = createCommand();
            const fakeNode = createFakeNode(fakeNodeDefaults);
    
            user.user.timeStart = 5 + 2 as BHTime;
            //#enregion Given

            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
    
            //#region Then
            .rejects.toThrow('Cmd: Set User: TimeStart too low');
            //#enregion Then
        });

        test('When the field timeStart is enaught: should do not throw error', async () => {
            //#region Given
            const { command, frame, user } = createCommand();
            const fakeNode = createFakeNode(fakeNodeDefaults);
    
            user.user.timeStart = 6 + 2 as BHTime;
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

        test('When the field timeEnd is too hight: should throw error', async () => {
            //#region Given
            const { command, frame, user } = createCommand();
            const fakeNode = createFakeNode(fakeNodeDefaults);
    
            user.user.timeEnd = 6 + 2 + 10000 as BHTime;
            //#enregion Given

            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
    
            //#region Then
            .rejects.toThrow('Cmd: Set User: TimeEnd too hight');
            //#enregion Then
        });

        test('When the field timeEnd is enaught: should do not throw error', async () => {
            //#region Given
            const { command, frame, user } = createCommand();
            const fakeNode = createFakeNode(fakeNodeDefaults);
    
            user.user.timeEnd = 6 + 2 + 9999 as BHTime;
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
});
