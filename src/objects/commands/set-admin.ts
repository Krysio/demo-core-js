import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_SET_ADMIN } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";
import { Admin } from "@/objects/users";

const errorMsgUnknownAuthor = 'Cmd: Set Admin: Author does not exist';
const errorMsgLowPermission = 'Cmd: Set Admin: Level too height';
const errorMsgDuplicateKey = 'Cmd: Set Admin: Duplicate key';

@Type(COMMAND_TYPE_SET_ADMIN)
export class SetAdminCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    //#enregion cmd config

    public admin: Admin = null;
    public reason: string = '';

    constructor(
        admin?: Admin,
        reason?: string
    ) {
        if (admin) this.admin = admin;
        if (reason) this.reason = reason;
    }

    //#region buffer

    public parse(buffer: WBuffer) {
        this.admin = Admin.parse(buffer);

        const sizeOfReasonStr = buffer.readUleb128();

        if (sizeOfReasonStr !== 0) {
            this.reason = buffer.read(sizeOfReasonStr).utf8();
        }

        return this;
    }

    public toBuffer(): WBuffer {
        const sizeOfReasonStr = this.reason.length;

        return WBuffer.concat([
            this.admin.toBuffer(),
            WBuffer.uleb128(sizeOfReasonStr),
            sizeOfReasonStr
                ? WBuffer.utf8(this.reason)
                : EMPTY_BUFFER
        ]);
    }

    //#enregion buffer

    public async verify(node: Node, frame: Frame) {
        const { publicKey: authorPublicKey } = frame.authors[0];

        if (!authorPublicKey.isEqual(node.rootKey)) {
            const author = await node.storeAdmin.get(authorPublicKey);
    
            if (!author) {
                throw new Error(errorMsgUnknownAuthor);
            }

            if (this.admin.level <= author.level) {
                throw new Error(errorMsgLowPermission);
            }
        }

        const result = await node.storeAdmin.get(this.admin.publicKey);

        if (result !== null) {
            throw new Error(errorMsgDuplicateKey);
        }
    }

    public async apply(node: Node, frame: Frame) {
        this.admin.parentPublicKey = frame.authors[0].publicKey;

        await node.storeAdmin.set(this.admin);
    }
}
