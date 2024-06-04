import { EventEmitter } from "node:stream";
import { Node } from '@/main';
import { createCommandParser } from "@/modules/commandParser";
import { Frame } from "../frame";
import { FlowVoteCommand } from "./vote-flow";
import { sha256, EMPTY_HASH } from "@/libs/crypto/sha256";
import { createKey } from "./test.helper";

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