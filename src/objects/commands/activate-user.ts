import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_ACTIVATE_USER } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";

// 0: current cadency, 1: next cademcy
const flagNextCadency = 1 << 0;

@Type(COMMAND_TYPE_ACTIVATE_USER)
export class ActivateUserCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    //#enregion cmd config

    public value = 0;

    constructor(value?: number) {
        if (value) this.value = value;
    }

    public isNextCadency() { return !!(this.value & flagNextCadency); }

    //#region buffer

    public parse(buffer: WBuffer) {
        this.value = buffer.readUleb128();

        return this;
    }

    public toBuffer(): WBuffer {
        return WBuffer.uleb128(this.value);
    }

    //#enregion buffer

    public async verify(node: Node, frame: Frame) {
        const errorMsgUnknownAuthor = 'Cmd: Activate User: Author does not exist';
        const errorMsgLocked = 'Cmd: Activate User: Account locked';
        const errorMsgTooEarly = 'Cmd: Activate User: Action induced too early';
        const errorMsgExpired = 'Cmd: Activate User: Account expired';
        const errorMsgDuplicateKey = 'Cmd: Activate User: Duplicate key';

        const { publicKey: authorPublicKey } = frame.authors[0];
        const author = await node.storeUser.get(authorPublicKey);

        if (author === null) {
            throw new Error(errorMsgUnknownAuthor);
        }

        if (author.isActivationLocked()) {
            throw new Error(errorMsgLocked);
        }

        const hbTime = this.isNextCadency()
            ? node.time.getTimeOfNextCadencyStart()
            : frame.anchorIndex + 2;

        if (author.timeStart > hbTime) {
            throw new Error(errorMsgTooEarly);
        }

        if (author.timeEnd < hbTime) {
            throw new Error(errorMsgExpired);
        }
        
        const existVoter = this.isNextCadency()
            ? await node.storeVoter.getNext(authorPublicKey)
            : await node.storeVoter.get(authorPublicKey);

        if (existVoter !== null) {
            throw new Error(errorMsgDuplicateKey);
        }
    }

    public async apply(node: Node, frame: Frame) {
        const { publicKey } = frame.authors[0];

        if (this.isNextCadency()) {
            const hbTimeOfAdded = node.time.getTimeOfNextCadencyStart();

            await node.storeVoter.addNext(publicKey, hbTimeOfAdded);
        } else {
            const hbTimeOfAdded = node.time.getTimeOfCadencyStart();

            await node.storeVoter.add(publicKey, hbTimeOfAdded);
        }
    }
}
