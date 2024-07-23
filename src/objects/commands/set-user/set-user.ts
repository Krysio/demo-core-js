import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_SET_USER } from "../types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from "..";
import { Frame } from "@/objects/frame";
import { User } from "@/objects/users";
import { BHTime } from "@/modules/time";

const errorMsgUnknownAuthor = 'Cmd: Set User: Author does not exist';
const errorMsgDuplicateKey = 'Cmd: Set User: Duplicate key';
const errorMsgTimeStart = 'Cmd: Set User: TimeStart too low';
const errorMsgTimeEnd = 'Cmd: Set User: TimeEnd too hight';

@Type(COMMAND_TYPE_SET_USER)
export class SetUserCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    //#enregion cmd config

    public user: User = null;
    public reason: string = '';

    constructor(
        user?: User,
        reason?: string
    ) {
        if (user) this.user = user;
        if (reason) this.reason = reason;
    }

    //#region buffer

    public parse(buffer: WBuffer) {
        this.user = User.parse(buffer);

        const sizeOfReasonStr = buffer.readUleb128();

        if (sizeOfReasonStr !== 0) {
            this.reason = buffer.read(sizeOfReasonStr).utf8();
        }

        return this;
    }

    public toBuffer(): WBuffer {
        const sizeOfReasonStr = this.reason.length;

        return WBuffer.concat([
            this.user.toBuffer(),
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

        const result = await node.storeUser.get(this.user.publicKey);

        if (result !== null) {
            throw new Error(errorMsgDuplicateKey);
        }

        const { timeBeforeAccountActivation, timeLiveOfUserAccount } = node.config;
        const { timeStart, timeEnd } = this.user;
        const timeNow = frame.anchorIndex + 2 as BHTime;
        const minTimeStart = timeNow + timeBeforeAccountActivation;
        
        if (minTimeStart >= timeStart) {
            throw new Error(errorMsgTimeStart);
        }

        const maxTimeEnd = timeNow + timeBeforeAccountActivation + timeLiveOfUserAccount as BHTime;

        if (maxTimeEnd < timeEnd) {
            throw new Error(errorMsgTimeEnd);
        }
    }

    public async apply(node: Node, frame: Frame) {
        this.user.parentPublicKey = frame.authors[0].publicKey;

        await node.storeUser.set(this.user);
    }
}
