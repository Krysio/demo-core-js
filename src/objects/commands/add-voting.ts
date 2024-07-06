import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_ADD_VOTING } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";
import { Voting } from "../voting";
import { doubleSha256 } from "@/libs/crypto/sha256";

@Type(COMMAND_TYPE_ADD_VOTING)
export class AddVotingCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    //#enregion cmd config

    public voting: Voting = null;

    constructor(
        voting?: Voting
    ) {
        if (voting) this.voting = voting;
    }

    //#region buffer

    public parse(buffer: WBuffer) {
        this.voting = Voting.parse(buffer);

        return this;
    }

    public toBuffer(): WBuffer {
        return this.voting.toBuffer();
    }

    //#enregion buffer

    public async verify(node: Node, frame: Frame) {
        const { publicKey: authorPublicKey } = frame.authors[0];
        const author = await node.storeAdmin.get(authorPublicKey);

        if (!author) {
            throw new Error('Cmd: Add Voting: Author does not exist');
        }

        const { timeStart, timeEnd } = (frame.data as AddVotingCommand).voting;

        if (node.time.isPeriodBreak(timeStart, timeEnd)) {
            throw new Error('Cmd: Add Voting: Invalid voting period');
        }

        const key = doubleSha256(this.toBuffer());
        const result = await node.storeVoting.get(key);

        if (result !== null) {
            throw new Error('Cmd: Add Voting: Duplicate voting hash');
        }
    }

    public async apply(node: Node) {
        await node.storeVoting.add(this.voting);
    }
}
