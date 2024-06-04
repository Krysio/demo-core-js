import { EventEmitter } from "node:stream";
import { Node } from '@/main';
import { createCommandParser } from "@/modules/commandParser";
import { Frame } from "../frame";
import { AddAdminCommand } from "./add-admin";
import { sha256 } from "@/libs/crypto/sha256";
import { createKey, createAdmin } from "./test.helper";
import { createStoreAdmin } from "@/modules/storeAdmin";
import { Admin } from "../users";

function createCommand({
    admin = createAdmin(),
    authorKey = createKey(),
} = {}) {
    const command = new AddAdminCommand(admin.admin);
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

test('To & from buffer', () => {
    const { frame } = createCommand();

    const bufferA = frame.toBuffer();
    const bufferB = Frame.parse(bufferA).toBuffer();

    expect(bufferA.isEqual(bufferB)).toBe(true);
});

test('Parsing', () => {
    const fakeNode = {
        events: new EventEmitter() as Node['events']
    };
    const parser = createCommandParser(fakeNode);
    const { frame } = createCommand();

    const buffer = frame.toBuffer('net');
    const parsingResult = parser.parseCommand(buffer);

    expect(parsingResult.isValid).toBe(true);
});

describe('Verify', () => {
    const fakeNode = {
        events: new EventEmitter() as Node['events'],
        config: {}
    } as Node;

    fakeNode.storeAdmin = createStoreAdmin(fakeNode);

    const authorKey = createKey();

    test('Author', async () => {
        const { command, frame, author } = createCommand({ authorKey });

        await expect((async () => {
            await command.verify(fakeNode, frame);
        })()).rejects.toThrow('Cmd: Add Admin: Author does not exist');

        author.parentPublicKey = createKey();
        await fakeNode.storeAdmin.add(author);

        await expect((async () => {
            await command.verify(fakeNode, frame);
        })()).resolves.not.toThrow();
    });

    test('Duplicate key', async () => {
        const { command, frame } = createCommand({ authorKey });

        await expect((async () => {
            await command.verify(fakeNode, frame);
        })()).resolves.not.toThrow();
        
        await command.apply(fakeNode, frame);

        await expect((async () => {
            await command.verify(fakeNode, frame);
        })()).rejects.toThrow('Cmd: Add Admin: duplicate key');
    });

    test('Level', async () => {
        const { command, frame } = createCommand({ authorKey });

        for (const level of [0, 4, 5]) {
            command.admin.level = level;

            await expect((async () => {
                await command.verify(fakeNode, frame);
            })()).rejects.toThrow('Cmd: Add Admin: level too height');
        }
    });
});
