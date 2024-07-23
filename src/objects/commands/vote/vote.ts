import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_VOTE } from "../types";
import { Type, ICommand, TYPE_ANCHOR_HASH, TYPE_VALUE_PRIMARY } from "..";
import { Frame } from "@/objects/frame";

@Type(COMMAND_TYPE_VOTE)
export class VoteCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_HASH;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = true;
    valueTypeID = TYPE_VALUE_PRIMARY;

    //#enregion cmd config

    public votingHash: WBuffer = null;
    public value: WBuffer = null;

    constructor(
        votingHash?: WBuffer,
        value?: WBuffer
    ) {
        if (votingHash) this.votingHash = votingHash;
        if (value) this.value = value;
    }

    //#region buffer

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

    //#enregion buffer

    public async verify(node: Node, frame: Frame) {
        const { publicKey: authorPublicKey } = frame.authors[0];
        const timeOfAuhorAdd = await node.storeVoter.get(authorPublicKey);

        if (timeOfAuhorAdd === null) {
            throw new Error('Cmd: Vote: Author does not exist');
        }

        const voting = await node.storeVoting.get(this.votingHash);

        if (!voting) {
            throw new Error('Cmd: Vote: Voting does not exist');
        }

        if (timeOfAuhorAdd >= voting.timeStart) {
            throw new Error('Cmd: Vote: Author\'s key is too young');
        }

        const currentTime = node.chainTop.getHeight();

        if (currentTime < voting.timeStart) {
            throw new Error('Cmd: Vote: Voting has not started');
        }

        if (currentTime > voting.timeEnd) {
            throw new Error('Cmd: Vote: Voting is over');
        }

        if (voting.isValidValue(this.value) === false) {
            throw new Error('Cmd: Vote: Invalid value');
        }
    }

    public getKeyOfValue(frame: Frame): WBuffer {
        return WBuffer.concat([
            frame.toBufferAuthors(),
            this.votingHash
        ]);
    }
}
