import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_ADD_USER } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";
import { User } from "@/objects/users";

@Type(COMMAND_TYPE_ADD_USER)
export class AddUserCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    public user: User = null;

    constructor(user?: User) {
        if (user) this.user = user;
    }

    public parse(buffer: WBuffer) {
        this.user = User.parse(buffer);

        return this;
    }

    public toBuffer(): WBuffer {
        return this.user.toBuffer();
    }

    public async verify(node: Node, frame: Frame) {
        const { publicKey: authorPublicKey } = frame.authors[0];
        const author = await node.storeAdmin.get(authorPublicKey);

        if (!author) {
            throw new Error('Cmd: Add User: Author does not exist');
        }

        const result = await node.storeUser.get(this.user.publicKey);

        if (result !== null) {
            throw new Error('Cmd: Add User: duplicate key');
        }

        const { timeBeforeAccountActivation, timeLiveOfUserAccount } = node.config;
        const { timeStart, timeEnd } = this.user;
        const timeNow = frame.anchorIndex + 2;
        const minTimeStart = timeNow + timeBeforeAccountActivation;
        
        if (minTimeStart >= timeStart) {
            throw new Error('Cmd: Add User: timeStart too low');
        }

        const maxTimeEnd = timeNow + timeBeforeAccountActivation + timeLiveOfUserAccount;

        if (maxTimeEnd < timeEnd) {
            throw new Error('Cmd: Add User: timeEnd too hight');
        }
    }

    public async apply(node: Node, frame: Frame) {
        this.user.parentPublicKey = frame.authors[0].publicKey;

        await node.storeUser.add(this.user);
    }
}
