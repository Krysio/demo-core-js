import { EventEmitter } from "node:stream";
import { Node } from '@/main';
import { createCommandParser } from "@/modules/commandParser";
import { Frame } from "@/objects/frame";
import { AddVotingCommand } from "./add-voting";
import { sha256 } from "@/libs/crypto/sha256";
import { createKey } from "./test.helper";
import { Admin } from "@/objects/users";
import { VotingSimple } from "@/objects/voting";

function createCommand({
    authorKey = createKey(),
    meta = ''
} = {}) {
    const voting = new VotingSimple(10, 1000, meta);
    const command = new AddVotingCommand(voting);
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

    return { frame, command, author };
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
