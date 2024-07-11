import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_DEL_ADMIN } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";
import { Key } from "@/objects/key";

const errorMsgTooFewAuthors = 'Cmd: Del Admin: Too few authors';
const errorMsgPermissions = 'Cmd: Del Admin: One of author have no perrmisions';
const errorMsgUnknownAuthor = 'Cmd: Del Admin: Author does not exist';
const errorMsgNotFound = 'Cmd: Del Admin: Admin not found';

@Type(COMMAND_TYPE_DEL_ADMIN)
export class DelAdminCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = true;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    //#enregion cmd config

    public adminPublicKey: Key = null;
    public reason: string = '';

    constructor(
        voterPublicKey?: Key,
        reason?: string
    ) {
        if (voterPublicKey) this.adminPublicKey = voterPublicKey;
        if (reason) this.reason = reason;
    }

    //#region buffer

    public parse(buffer: WBuffer) {
        this.adminPublicKey = Key.parse(buffer);

        const sizeOfReasonStr = buffer.readUleb128();

        if (sizeOfReasonStr !== 0) {
            this.reason = buffer.read(sizeOfReasonStr).utf8();
        }

        return this;
    }

    public toBuffer(): WBuffer {
        const sizeOfReasonStr = this.reason.length;

        return WBuffer.concat([
            this.adminPublicKey.toBuffer(),
            WBuffer.uleb128(sizeOfReasonStr),
            sizeOfReasonStr
                ? WBuffer.utf8(this.reason)
                : EMPTY_BUFFER
        ]);
    }

    //#enregion buffer

    public async verify(node: Node, frame: Frame) {
        const {
            minSignaturesSameLevel,
            minSignaturesLowerLevel,
            maxLevel
        } = node.config.rules.admin.delAdmin;

        const admin = await node.storeAdmin.get(this.adminPublicKey);
    
        if (admin === null) {
            throw new Error(errorMsgNotFound);
        }

        let countOfAuthorsWithLowerLevel = 0;
        let countOfAuthorsWithSameLevel = 0;

        for (const { publicKey: authorPublicKey } of frame.authors) {
            const author = await node.storeAdmin.get(authorPublicKey);

            if (!author) {
                throw new Error(errorMsgUnknownAuthor);
            }

            if (author.level > maxLevel) {
                throw new Error(errorMsgPermissions);
            }

            if (author.level > admin.level) {
                throw new Error(errorMsgPermissions);
            }

            if (author.level === admin.level) {
                countOfAuthorsWithSameLevel++;
            } else {
                countOfAuthorsWithLowerLevel++;
            }
        }

        if (countOfAuthorsWithSameLevel < minSignaturesSameLevel
            && countOfAuthorsWithLowerLevel < minSignaturesLowerLevel
        ) {
            throw new Error(errorMsgTooFewAuthors);
        }
    }

    public async apply(node: Node) {
        await node.storeAdmin.del(this.adminPublicKey);
    }
}
