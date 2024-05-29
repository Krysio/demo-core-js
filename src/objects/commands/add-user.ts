import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_ADD_USER } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX } from ".";
import { Frame } from "@/objects/frame";
import { User } from "@/objects/users";

@Type(COMMAND_TYPE_ADD_USER)
export class AddUserCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    primaryValue = 0;
    secondaryValue = 1;

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
        const key = this.user.publicKey.toBuffer();
        const result = await node.storeUser.get(key);

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

        const key = this.user.publicKey.toBuffer();
        const value = this.user.toBuffer('db');

        await node.storeUser.add(key, value);
    }
}
