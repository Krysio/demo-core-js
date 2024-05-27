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
    value = 0;

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
        // User-key doesn't exist
        // Validate times
    }
}
