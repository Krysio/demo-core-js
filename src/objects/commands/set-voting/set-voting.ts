import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_SET_VOTING } from "../types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from "..";
import { Frame } from "@/objects/frame";
import { Voting } from "@/objects/voting";
import { doubleSha256 } from "@/libs/crypto/sha256";

const errorMsgUnknownAuthor = 'Cmd: Set Voting: Author does not exist';
const errorMsgInvalidPeriod = 'Cmd: Set Voting: Invalid voting period';
const errorMsgDuplicateKey = 'Cmd: Set Voting: Duplicate voting hash';

@Type(COMMAND_TYPE_SET_VOTING)
export class SetVotingCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    //#enregion cmd config

    public voting: Voting = null;
    public reason: string = '';

    constructor(
        voting?: Voting,
        reason?: string
    ) {
        if (voting) this.voting = voting;
        if (reason) this.reason = reason;
    }

    public getHash() {
        return doubleSha256(this.toBuffer());
    }

    //#region buffer

    public parse(buffer: WBuffer) {
        this.voting = Voting.parse(buffer);

        const sizeOfReasonStr = buffer.readUleb128();

        if (sizeOfReasonStr !== 0) {
            this.reason = buffer.read(sizeOfReasonStr).utf8();
        }

        return this;
    }

    public toBuffer(): WBuffer {
        const sizeOfReasonStr = this.reason.length;

        return WBuffer.concat([
            this.voting.toBuffer(),
            WBuffer.uleb128(sizeOfReasonStr),
            sizeOfReasonStr
                ? WBuffer.utf8(this.reason)
                : EMPTY_BUFFER
        ]);
    }

    //#enregion buffer

    public async verify(node: Node, frame: Frame) {
        const { publicKey: authorPublicKey } = frame.authors[0];
        const author = await node.storeAdmin.get(authorPublicKey);

        if (!author) {
            throw new Error(errorMsgUnknownAuthor);
        }

        const { timeStart, timeEnd } = (frame.data as SetVotingCommand).voting;

        if (node.time.isPeriodBreak(timeStart, timeEnd)) {
            throw new Error(errorMsgInvalidPeriod);
        }

        const key = this.getHash();
        const result = await node.storeVoting.get(key);

        if (result !== null) {
            throw new Error(errorMsgDuplicateKey);
        }
    }

    public async apply(node: Node) {
        await node.storeVoting.set(this.voting);
    }
}
