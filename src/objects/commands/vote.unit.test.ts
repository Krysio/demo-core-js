import { EventEmitter } from "node:stream";
import { Node } from '@/main';
import { createCommandParser } from "@/modules/commandParser";
import { Frame } from "../frame";
import { VoteCommand } from "./vote";
import { sha256, EMPTY_HASH } from "@/libs/crypto/sha256";
import { createKey } from "./test.helper";
import WBuffer from "@/libs/WBuffer";

function createCommand({
    authorKey = createKey(),
    vottingHash = EMPTY_HASH,
    value = WBuffer.hex`00`,
} = {}) {
    const command = new VoteCommand(vottingHash, value);
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
    const { frame } = createCommand({ value: WBuffer.hex`4455` });

    const buffer = frame.toBuffer('net');
    const parsingResult = parser.parseCommand(buffer);

    expect(parsingResult.isValid).toBe(true);
    expect((parsingResult.data as unknown as VoteCommand).value.hex()).toBe('4455');
});
