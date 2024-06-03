import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_VOTE_FLOW } from "./types";
import { Type, ICommand, TYPE_ANCHOR_HASH, TYPE_VALUE_PRIMARY } from ".";
import { Frame } from "@/objects/frame";
import { Key } from "@/objects/key";

@Type(COMMAND_TYPE_VOTE_FLOW)
export class FlowVoteCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_HASH;
    isInternal = false;
    isMultiAuthor = false;
    valueTypeID = TYPE_VALUE_PRIMARY;

    public votingHash: WBuffer = null;
    public userPublicKey: Key = null;

    constructor(
        votingHash?: WBuffer,
        userPublicKey?: Key
    ) {
        if (votingHash) this.votingHash = votingHash;
        if (userPublicKey) this.userPublicKey = userPublicKey;
    }

    public parse(buffer: WBuffer) {
        this.votingHash = buffer.read(32);
        this.userPublicKey = Key.parse(buffer);

        return this;
    }

    public toBuffer(): WBuffer {
        return WBuffer.concat([
            this.votingHash,
            this.userPublicKey.toBuffer(),
        ]);
    }

    public async verify(node: Node, frame: Frame) {
        // votingHash exist
        // Validate value
    }

    public getKeyOfValue(frame: Frame): WBuffer {
        return WBuffer.concat([
            frame.toBufferAuthors(),
            this.votingHash
        ]);
    }
}
