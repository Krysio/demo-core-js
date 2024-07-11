import { createFakeNode, createKey } from "@/tests/helper";
import { ExFrame } from "@/objects/frame";
import { DelUserCommand } from "./del-user";
import { Key } from "@/objects/key";

function createCommand({
    reason = '',
    countOfAuthors = 2,
    anchor = 0
} = {}) {
    const userKey = createKey();
    const command = new DelUserCommand(userKey, reason);
    const frame = new ExFrame(command);
    const listOfAuthorsKey: Key[] = [];

    for (let i = 0; i < countOfAuthors; i++) {
        listOfAuthorsKey.push(createKey());
    }

    frame.setAnchor(anchor);
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
    const bufferB = new DelUserCommand().parse(bufferA).toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});

describe('Verifivation', () => {
    test('When user is out of the store: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeUser: { get: () => Promise.resolve(null) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del User: User not found');
        //#enregion Then
    });

    test('When count of authors are less than a rule value: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand({countOfAuthors: 2});
        const fakeNode = createFakeNode({
            config: { rules: { admin: { delUser: { minSignatures: 3 } } } },
            storeUser: { get: () => Promise.resolve({}) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del User: Too few authors');
        //#enregion Then
    });

    test('When author is out of the store: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            storeUser: { get: () => Promise.resolve({}) },
            storeAdmin: { get: () => Promise.resolve(null) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del User: Author does not exist');
        //#enregion Then
    });

    test('When author\'s level is too hight: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const fakeNode = createFakeNode({
            config: { rules: { admin: { delUser: { maxLevel: 3 } } } },
            storeAdmin: { get: () => Promise.resolve({ level: 4 }) },
            storeUser: { get: () => Promise.resolve({}) },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del User: One of author have no perrmisions');
        //#enregion Then
    });

    describe('When author is the one who was add the user', () => {
        test('When the user might have been activated: should throw error', async () => {
            //#region Given
            const { command, frame, listOfAuthorsKey: [ authorKey ] } = createCommand({ countOfAuthors: 1, anchor: 9 });
            const fakeNode = createFakeNode({
                storeAdmin: { get: () => Promise.resolve({}) },
                storeUser: { get: () => Promise.resolve({ parentPublicKey: authorKey, timeStart: 10 }) },
            });
            //#enregion Given
    
            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
        
            //#region Then
            .rejects.toThrow('Cmd: Del User: Too late to remove child-user');
            //#enregion Then
        });
    });
});
