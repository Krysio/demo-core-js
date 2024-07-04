import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_ACTIVATE_USER } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";

@Type(COMMAND_TYPE_ACTIVATE_USER)
export class ActivateUserCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    public value = 0;
    /** (this.value & 1)
     * 0: current cadency
     * 1: next cademcy
     */
    public isNextCadency() {return this.value & 1}

    constructor(value?: number) {
        if (value) this.value = value;
    }

    public parse(buffer: WBuffer) {
        this.value = buffer.readUleb128();

        return this;
    }

    public toBuffer(): WBuffer {
        return WBuffer.uleb128(this.value);
    }

    public async verify(node: Node, frame: Frame) {
        const errorMsgUnknownAuthor = 'Cmd: Activate User: Author does not exist';
        const errorMsgTooEarly = 'Cmd: Activate User: Action induced too early';
        const errorMsgExpired = 'Cmd: Activate User: Account expired';
        const errorMsgDuplicateKey = 'Cmd: Activate User: Duplicate key';

        const { publicKey: authorPublicKey } = frame.authors[0];
        const author = await node.storeUser.get(authorPublicKey);

        if (author === null) {
            throw new Error(errorMsgUnknownAuthor);
        }

        const hbTime = this.isNextCadency()
            ? node.time.getHbTimeOfNextCadencyStart()
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
            const hbTimeOfAdded = node.time.getHbTimeOfNextCadencyStart();

            await node.storeVoter.addNext(publicKey, hbTimeOfAdded);
        } else {
            const hbTimeOfAdded = node.time.getHbTimeOfCadencyStart();

            await node.storeVoter.add(publicKey, hbTimeOfAdded);
        }
    }
}
