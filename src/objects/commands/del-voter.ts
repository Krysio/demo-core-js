import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_DEL_USER } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";
import { Key } from "../key";

const errorMsgTooFewAuthors = 'Cmd: Del Voter: Too few authors';
const errorMsgUnknownAuthor = 'Cmd: Del Voter: Author does not exist';
const errorMsgNotFound = 'Cmd: Del Voter: Voter not found';

// 0: current cadency, 1: next cademcy
const flagNextCadency = 1 << 0;

@Type(COMMAND_TYPE_DEL_USER)
export class DelVoterCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = true;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    //#enregion cmd config

    public voterPublicKey: Key = null;
    public flags = 0;
    public reason: string = '';

    constructor(
        voterPublicKey?: Key,
        reason?: string,
        flags?: number
    ) {
        if (voterPublicKey) this.voterPublicKey = voterPublicKey;
        if (reason) this.reason = reason;
        if (flags) this.flags = flags;
    }

    public isNextCadency() {
        return !!(this.flags & flagNextCadency);
    }
    public setNextCadency(flag: boolean) {
        this.flags = flag
            ? this.flags | flagNextCadency
            : this.flags & (0xff ^ flagNextCadency);

        return this;
    }

    //#region buffer

    public parse(buffer: WBuffer) {
        this.voterPublicKey = Key.parse(buffer);
        this.flags = buffer.readUleb128();

        const sizeOfReasonStr = buffer.readUleb128();

        if (sizeOfReasonStr !== 0) {
            this.reason = buffer.read(sizeOfReasonStr).utf8();
        }

        return this;
    }

    public toBuffer(): WBuffer {
        const sizeOfReasonStr = this.reason.length;

        return WBuffer.concat([
            this.voterPublicKey.toBuffer(),
            WBuffer.uleb128(this.flags),
            WBuffer.uleb128(sizeOfReasonStr),
            sizeOfReasonStr
                ? WBuffer.utf8(this.reason)
                : EMPTY_BUFFER
        ]);
    }

    //#enregion buffer

    public async verify(node: Node, frame: Frame) {
        const { length: countOfAuthors } = frame.authors;

        if (countOfAuthors < 2) {
            throw new Error(errorMsgTooFewAuthors);
        }

        for (const { publicKey: authorPublicKey } of frame.authors) {
            const author = await node.storeAdmin.get(authorPublicKey);

            if (!author) {
                throw new Error(errorMsgUnknownAuthor);
            }
        }

        const result = this.isNextCadency()
            ? await node.storeVoter.getNext(this.voterPublicKey)
            : await node.storeVoter.get(this.voterPublicKey);
    
        if (result === null) {
            throw new Error(errorMsgNotFound);
        }
    }

    public async apply(node: Node) {
        await node.storeVoter.del(this.voterPublicKey);
    }
}
