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
    isValueHasKey = true;
    valueTypeID = TYPE_VALUE_PRIMARY;

    public votingHash: WBuffer = null;
    public voterPublicKey: Key = null;

    constructor(
        votingHash?: WBuffer,
        voterPublicKey?: Key
    ) {
        if (votingHash) this.votingHash = votingHash;
        if (voterPublicKey) this.voterPublicKey = voterPublicKey;
    }

    public parse(buffer: WBuffer) {
        this.votingHash = buffer.read(32);
        this.voterPublicKey = Key.parse(buffer);

        return this;
    }

    public toBuffer(): WBuffer {
        return WBuffer.concat([
            this.votingHash,
            this.voterPublicKey.toBuffer(),
        ]);
    }

    public async verify(node: Node, frame: Frame) {
        const { publicKey: authorPublicKey } = frame.authors[0];
        const isVoterExist = await node.storeVoter.get(authorPublicKey);

        if (isVoterExist === null) {
            throw new Error('Cmd: Vote-flow: Author does not exist');
        }

        const voting = await node.storeVoting.get(this.votingHash);

        if (!voting) {
            throw new Error('Cmd: Vote-flow: Voting does not exist');
        }

        const isTargetVoterExist = await node.storeVoter.get(this.voterPublicKey);

        if (isTargetVoterExist === null) {
            throw new Error('Cmd: Vote-flow: Target voter account does not exist');
        }
    }

    public getKeyOfValue(frame: Frame): WBuffer {
        return WBuffer.concat([
            frame.toBufferAuthors(),
            this.votingHash
        ]);
    }
}
