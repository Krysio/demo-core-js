import { EventEmitter } from "node:stream";
import { Node } from '@/main';
import { createCommandParser } from "@/modules/commandParser";
import { Frame } from "../frame";
import { AddUserCommand } from "./add-user";
import { sha256 } from "@/libs/crypto/sha256";
import { createKey, createUser } from "./test.helper";
import { createStoreUser } from "@/modules/storeUser";
import { createStoreAdmin } from "@/modules/storeAdmin";
import { Admin } from "../users";

function createCommand({
    user = createUser(),
    authorKey = createKey(),
} = {}) {
    const command = new AddUserCommand(user.user);
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

test('Add to store', async () => {
    const fakeNode = {
        events: new EventEmitter() as Node['events']
    } as Node;

    fakeNode.storeUser = createStoreUser(fakeNode);

    const { command, frame, user } = createCommand();

    await expect((async () => {
        await command.apply(fakeNode, frame);
    })()).resolves.not.toThrow();

    const value = fakeNode.storeUser.get(user.key);

    expect(value).not.toBe(null);
});

describe('Verify', () => {
    const fakeNode = {
        events: new EventEmitter() as Node['events'],
        config: {
            timeBeforeAccountActivation: 5,
            timeLiveOfUserAccount: 10000
        }
    } as Node;

    fakeNode.storeAdmin = createStoreAdmin(fakeNode);
    fakeNode.storeUser = createStoreUser(fakeNode);

    const authorKey = createKey();

    test('Author', async () => {
        const { command, frame, author } = createCommand({ authorKey });

        await expect((async () => {
            await command.verify(fakeNode, frame);
        })()).rejects.toThrow('Cmd: Add User: Author does not exist');

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
        })()).rejects.toThrow('Cmd: Add User: duplicate key');
    });

    describe('Time values', () => {
        test('Time start', async () => {
            const { command, frame, user } = createCommand({ authorKey });
    
            user.user.timeStart = 5 + 2;
    
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })()).rejects.toThrow('Cmd: Add User: timeStart too low');
    
            user.user.timeStart = 6 + 2;
            
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })()).resolves.not.toThrow();
        });

        test('Time end', async () => {
            const { command, frame, user } = createCommand({ authorKey });
    
            user.user.timeEnd = 6 + 2 + 10000;
    
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })()).rejects.toThrow('Cmd: Add User: timeEnd too hight');
    
            user.user.timeEnd = 6 + 2 + 9999;
            
            await expect((async () => {
                await command.verify(fakeNode, frame);
            })()).resolves.not.toThrow();
        });
    });
});