import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_VOTE } from "./types";
import { Type, ICommand, TYPE_ANCHOR_HASH } from ".";
import { Frame } from "@/objects/frame";

@Type(COMMAND_TYPE_VOTE)
export class VoteCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_HASH;
    isInternal = false;
    isMultiAuthor = false;
    primaryValue = 1;
    secondaryValue = 0;

    public votingHash: WBuffer = null;
    public value: WBuffer = null;

    constructor(
        votingHash?: WBuffer,
        value?: WBuffer
    ) {
        if (votingHash) this.votingHash = votingHash;
        if (value) this.value = value;
    }

    public parse(buffer: WBuffer) {
        this.votingHash = buffer.read(32);
        this.value = buffer.read(buffer.readUleb128());

        return this;
    }

    public toBuffer(): WBuffer {
        return WBuffer.concat([
            this.votingHash,
            WBuffer.uleb128(this.value.length),
            this.value,
        ]);
    }

    public async verify(node: Node, frame: Frame) {
        // votingHash exist
        // Validate value
    }
}
