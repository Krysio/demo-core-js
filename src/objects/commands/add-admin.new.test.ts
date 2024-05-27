import { EventEmitter } from "node:stream";
import { Node } from '@/main';
import { createCommandParser } from "@/modules/commandParser";
import { Frame } from "../frame";
import { AddAdminCommand } from "./add-admin";
import { sha256 } from "@/libs/crypto/sha256";
import { createAdmin } from "./test.helper";

function createCommand({
    admin = createAdmin(),
    author = createAdmin()
} = {}) {
    const command = new AddAdminCommand(admin.admin);
    const frame = new Frame(command);

    frame.authors.push({
        publicKey: author.key,
        signature: null
    });

    frame.authors[0].signature = author.key.sign(
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

describe('Parsing', () => {
    const fakeNode = {
        events: new EventEmitter() as Node['events']
    };
    const parser = createCommandParser(fakeNode);
    const admin01 = createAdmin();

    test('First add user', () => {
        const { frame } = createCommand({ admin: admin01 });

        const buffer = frame.toBuffer('net');
        const parsingResult = parser.parseCommand(buffer);

        expect(parsingResult.isValid).toBe(true);
    });
});
