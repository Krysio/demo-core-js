import { createKey } from "@/tests/helper";
import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { Frame } from "@/objects/frame";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from "@/objects/commands";
import { sha256, EMPTY_HASH } from "@/libs/crypto/sha256";

@Type(0)
class TestCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    public parse(buffer: WBuffer) {
        buffer.read(4);
        return this;
    }
    public toBuffer() {
        return WBuffer.hex('11223344');
    }
    public async verify(node: Node, frame: Frame) {};
}

function createFrame({
    authorKey = createKey(),
} = {}) {
    const command = new TestCommand();
    const frame = new Frame(command);

    frame.anchorHash = EMPTY_HASH;

    frame.authors.push({
        publicKey: authorKey,
        signature: null
    });

    const hashOfFrame = sha256(frame.toBuffer('hash'));

    frame.authors[0].signature = authorKey.sign(hashOfFrame);

    return { frame, command, authorKey };
}

test('To & from buffer should result the same data', () => {
    //#region Given
    const { frame } = createFrame();
    //#enregion Given

    //#region When
    const bufferA = frame.toBuffer();
    const bufferB = Frame.parse(bufferA).toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});
