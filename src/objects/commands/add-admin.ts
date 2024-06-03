import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_ADD_ADMIN } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";
import { Admin } from "@/objects/users";

@Type(COMMAND_TYPE_ADD_ADMIN)
export class AddAdminCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

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
        const { publicKey: authorPublicKey } = frame.authors[0];
        const author = await node.storeAdmin.get(authorPublicKey);

        if (!author) {
            throw new Error('Cmd: Add Admin: Author does not exist');
        }

        const result = await node.storeAdmin.get(this.admin.publicKey);

        if (result !== null) {
            throw new Error('Cmd: Add Admin: duplicate key');
        }

        if (this.admin.level <= author.level) {
            throw new Error('Cmd: Add Admin: level too height');
        }
    }

    public async apply(node: Node, frame: Frame) {
        this.admin.parentPublicKey = frame.authors[0].publicKey;

        await node.storeAdmin.add(this.admin);
    }
}
