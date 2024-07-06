import { createKey, createAdmin, createFakeNode } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { Admin } from "@/objects/users";
import { sha256 } from "@/libs/crypto/sha256";
import { SetAdminCommand } from "./set-admin";

function createCommand({
    admin = createAdmin(),
    authorKey = createKey(),
} = {}) {
    const command = new SetAdminCommand(admin.admin);
    const frame = new Frame(command);
    const author = new Admin(authorKey);

    author.level = 5;
    command.admin.level = 10;

    frame.authors.push({
        publicKey: authorKey,
        signature: null
    });

    frame.authors[0].signature = authorKey.sign(
        sha256(frame.toBuffer('hash'))
    );

    return { frame, command, author, admin };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new SetAdminCommand().parse(bufferA).toBuffer();
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
            storeAdmin: { get: jest.fn(() => null) },
            rootKey: createKey(),
        });
        //#enregion Given

        //#region When
        const result = await expect((async () => {
            await command.verify(fakeNode, frame);
        })());
        //#enregion When
    
        //#region Then
        result.rejects.toThrow('Cmd: Set Admin: Author does not exist');
        //#enregion Then
    });

    test('When author is in the store: should do not throw error', async () => {
        //#region Given
        const { command, frame, author } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: {
                get: jest.fn((key) => {
                    if (author.publicKey.isEqual(key)) return author;
                    return null;
                })
            },
            rootKey: createKey(),
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

    test('When author is the root: should do not throw error', async () => {
        //#region Given
        const rootKey = createKey();
        const { command, frame } = createCommand({ authorKey: rootKey });
        const fakeNode = createFakeNode({
            storeAdmin: {
                get: () => Promise.resolve(null),
            },
            rootKey,
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

    test('When inserting key is in the store: should throw error', async () => {
        //#region Given
        const { command, frame, admin, author } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: {
                get: jest.fn((key) => {
                    if (author.publicKey.isEqual(key)) return author;
                    if (admin.key.isEqual(key)) return admin;
                    return null;
                })
            },
            rootKey: createKey(),
        });
        //#enregion Given

        //#region When
        const result = await expect((async () => {
            await command.verify(fakeNode, frame);
        })());
        //#enregion When
    
        //#region Then
        result.rejects.toThrow('Cmd: Set Admin: Duplicate key');
        //#enregion Then
    });

    test('When level of inserting admin is to hight: should throw error', async () => {
        //#region Given
        const { command, frame, author } = createCommand();
        const fakeNode = createFakeNode({
            storeAdmin: {
                get: jest.fn((key) => {
                    if (author.publicKey.isEqual(key)) return author;
                    return null;
                })
            },
            rootKey: createKey(),
        });

        for (const level of [0, 4, 5]) {
            command.admin.level = level;
            //#enregion Given
    
            //#region When
            const result = await expect((async () => {
                await command.verify(fakeNode, frame);
            })());
    
            //#region Then
            result.rejects.toThrow('Cmd: Set Admin: Level too height');
            //#enregion Then
        }
    });
});
