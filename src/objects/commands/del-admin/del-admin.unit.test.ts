import { createFakeNode, createKey } from "@/tests/helper";
import { ExFrame } from "@/objects/frame";
import { DelAdminCommand } from "./del-admin";
import { Key } from "@/objects/key";

function createCommand({
    reason = '',
    countOfAuthors = 2,
    anchor = 0
} = {}) {
    const adminKey = createKey();
    const command = new DelAdminCommand(adminKey, reason);
    const frame = new ExFrame(command);
    const listOfAuthorsKeys: Key[] = [];

    for (let i = 0; i < countOfAuthors; i++) {
        listOfAuthorsKeys.push(createKey());
    }

    frame.setAnchor(anchor);
    listOfAuthorsKeys.forEach((publicKey) => {
        frame.addAuthor(publicKey);
    });
    listOfAuthorsKeys.forEach((publicKey) => {
        frame.addSignature(publicKey, publicKey.sign(frame.getHash()));
    });

    return { frame, command, listOfAuthorsKey: listOfAuthorsKeys };
}

const delAdminRules = {
    minSignaturesLowerLevel: 2,
    minSignaturesSameLevel: 3,
    maxLevel: 3,
};

test('To & from buffer should result the same data', () => {
    //#region Given
    const { command } = createCommand();
    //#enregion Given

    //#region When
    const bufferA = command.toBuffer();
    const bufferB = new DelAdminCommand().parse(bufferA).toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});

describe('Verifivation', () => {
    test('When deleted admin is out of the store: should throw error', async () => {
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
        .rejects.toThrow('Cmd: Del Admin: Admin not found');
        //#enregion Then
    });

    test('When author is out of the store: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const iterStoreAdminGet = (function* (){
            yield Promise.resolve({});
            while (true) yield Promise.resolve(null);
        })();
        const fakeNode = createFakeNode({
            storeAdmin: { get: () => iterStoreAdminGet.next().value },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del Admin: Author does not exist');
        //#enregion Then
    });

    test('When author\'s level is too hight: should throw error', async () => {
        //#region Given
        const { command, frame } = createCommand();
        const iterStoreAdminGet = (function* (){
            yield Promise.resolve({});
            while (true) yield Promise.resolve({ level: 4 });
        })();
        const fakeNode = createFakeNode({
            config: { rules: { admin: { delAdmin: delAdminRules } } },
            storeAdmin: { get: () => iterStoreAdminGet.next().value },
        });
        //#enregion Given

        //#region When
        await expect((async () => {
            await command.verify(fakeNode, frame);
        })())
        //#enregion When
    
        //#region Then
        .rejects.toThrow('Cmd: Del Admin: One of author have no perrmisions');
        //#enregion Then
    });

    describe('When count of authors are less than a rule value', () => {
        test('minSignaturesSameLevel', async () => {
            //#region Given
            const { command, frame } = createCommand({countOfAuthors: 2});
            const fakeNode = createFakeNode({
                config: { rules: { admin: { delAdmin: delAdminRules } } },
                storeAdmin: { get: () => Promise.resolve({ level: 1 }) },
            });
            //#enregion Given
    
            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
        
            //#region Then
            .rejects.toThrow('Cmd: Del Admin: Too few authors');
            //#enregion Then
        });
        test('minSignaturesLowerLevel', async () => {
            //#region Given
            const { command, frame } = createCommand({countOfAuthors: 1});
            const iterStoreAdminGet = (function* (){
                yield Promise.resolve({ level: 3 });
                while (true) yield Promise.resolve({ level: 2 });
            })();
            const fakeNode = createFakeNode({
                config: { rules: { admin: { delAdmin: delAdminRules } } },
                storeAdmin: { get: () => iterStoreAdminGet.next().value },
            });
            //#enregion Given

            //#region When
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })())
            //#enregion When
        
            //#region Then
            .rejects.toThrow('Cmd: Del Admin: Too few authors');
            //#enregion Then
        });
    });
});
