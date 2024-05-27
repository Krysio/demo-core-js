import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_ADD_ADMIN } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX } from ".";
import { Frame } from "@/objects/frame";
import { Admin } from "@/objects/users";

@Type(COMMAND_TYPE_ADD_ADMIN)
export class AddAdminCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    value = 0;

    public admin: Admin = null;

    constructor(admin?: Admin) {
        if (admin) this.admin = admin;
    }

    public parse(buffer: WBuffer) {
        this.admin = Admin.parse(buffer);

        return this;
    }

    public toBuffer(): WBuffer {
        return this.admin.toBuffer();
    }

    public async verify(node: Node, frame: Frame) {
        // User-key doesn't exist
        // Validate times
        // Autorize author
    }
}
