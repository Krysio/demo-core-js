import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_ADD_VOTING } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";
import { Voting } from "../voting";

@Type(COMMAND_TYPE_ADD_VOTING)
export class AddVotingCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    public voting: Voting = null;

    constructor(
        voting?: Voting
    ) {
        if (voting) this.voting = voting;
    }

    public parse(buffer: WBuffer) {
        this.voting = Voting.parse(buffer);

        return this;
    }

    public toBuffer(): WBuffer {
        return this.voting.toBuffer();
    }

    public async verify(node: Node, frame: Frame) {
    }

    public async apply(node: Node, frame: Frame) {
        await node.storeVoting.add(this.voting);
    }
}
