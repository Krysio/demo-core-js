import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_VOTE_FLOW } from "../types";
import { Type, ICommand, TYPE_ANCHOR_HASH, TYPE_VALUE_PRIMARY } from "..";
import { Frame } from "@/objects/frame";
import { Key } from "@/objects/key";

@Type(COMMAND_TYPE_VOTE_FLOW)
export class FlowVoteCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_HASH;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = true;
    valueTypeID = TYPE_VALUE_PRIMARY;

    //#enregion cmd config

    public votingHash: WBuffer = null;
    public voterPublicKey: Key = null;

    constructor(
        votingHash?: WBuffer,
        voterPublicKey?: Key
    ) {
        if (votingHash) this.votingHash = votingHash;
        if (voterPublicKey) this.voterPublicKey = voterPublicKey;
    }

    //#region buffer

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

    //#enregion buffer

    public async verify(node: Node, frame: Frame) {
        const { publicKey: authorPublicKey } = frame.authors[0];
        const timeOfAuhorAdd = await node.storeVoter.get(authorPublicKey);

        if (timeOfAuhorAdd === null) {
            throw new Error('Cmd: Vote-flow: Author does not exist');
        }

        const voting = await node.storeVoting.get(this.votingHash);

        if (!voting) {
            throw new Error('Cmd: Vote-flow: Voting does not exist');
        }

        if (voting.isAllowFlow === false) {
            throw new Error('Cmd: Vote-flow: Voting do not allow for flow-votes');
        }

        if (timeOfAuhorAdd >= voting.timeStart) {
            throw new Error('Cmd: Vote-flow: Author\'s key is too young');
        }

        const isTargetVoterExist = await node.storeVoter.get(this.voterPublicKey);

        if (isTargetVoterExist === null) {
            throw new Error('Cmd: Vote-flow: Target voter account does not exist');
        }

        const currentTime = node.chainTop.getHeight();

        if (currentTime < voting.timeStart) {
            throw new Error('Cmd: Vote-flow: Voting has not started');
        }

        if (currentTime > voting.timeEnd) {
            throw new Error('Cmd: Vote-flow: Voting is over');
        }
    }

    public getKeyOfValue(frame: Frame): WBuffer {
        return WBuffer.concat([
            frame.toBufferAuthors(),
            this.votingHash
        ]);
    }
}
