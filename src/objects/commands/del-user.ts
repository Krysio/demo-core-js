import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_DEL_USER } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Frame } from "@/objects/frame";
import { Key } from "../key";
import { BHTime } from "@/modules/time";

const errorMsgTooFewAuthors = 'Cmd: Del User: Too few authors';
const errorMsgPermissions = 'Cmd: Del User: One of author have no perrmisions';
const errorMsgUnknownAuthor = 'Cmd: Del User: Author does not exist';
const errorMsgNotFound = 'Cmd: Del User: User not found';
const errorMsgTooLate = 'Cmd: Del User: Too late to remove child-user';

@Type(COMMAND_TYPE_DEL_USER)
export class DelUserCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = false;
    isMultiAuthor = true;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_SECONDARY;

    //#enregion cmd config

    public userPublicKey: Key = null;
    public reason: string = '';

    constructor(
        userPublicKey?: Key,
        reason?: string
    ) {
        if (userPublicKey) this.userPublicKey = userPublicKey;
        if (reason) this.reason = reason;
    }

    //#region buffer

    public parse(buffer: WBuffer) {
        this.userPublicKey = Key.parse(buffer);

        const sizeOfReasonStr = buffer.readUleb128();

        if (sizeOfReasonStr !== 0) {
            this.reason = buffer.read(sizeOfReasonStr).utf8();
        }

        return this;
    }

    public toBuffer(): WBuffer {
        const sizeOfReasonStr = this.reason.length;

        return WBuffer.concat([
            this.userPublicKey.toBuffer(),
            WBuffer.uleb128(sizeOfReasonStr),
            sizeOfReasonStr
                ? WBuffer.utf8(this.reason)
                : EMPTY_BUFFER
        ]);
    }

    //#enregion buffer

    public async verify(node: Node, frame: Frame) {
        const { timeApplyDelay: delay } = node.config;
        const { minSignatures, maxLevel } = node.config.rules.admin.delUser;
        const { length: countOfAuthors } = frame.authors;

        const user = await node.storeUser.get(this.userPublicKey);
    
        if (user === null) {
            throw new Error(errorMsgNotFound);
        }

        const { publicKey: authorPublicKey } = frame.getAuthor();

        if (
            countOfAuthors === 1
            && authorPublicKey.isEqual(user.parentPublicKey)
        ) {
            const applyBHTime = frame.anchorIndex + 2 + delay as BHTime;

            if (user.timeStart <= applyBHTime) {
                throw new Error(errorMsgTooLate);
            }

            const author = await node.storeAdmin.get(authorPublicKey);

            if (!author) {
                throw new Error(errorMsgUnknownAuthor);
            }

            return;
        }

        if (countOfAuthors < minSignatures) {
            throw new Error(errorMsgTooFewAuthors);
        }

        for (const { publicKey: authorPublicKey } of frame.authors) {
            const author = await node.storeAdmin.get(authorPublicKey);

            if (!author) {
                throw new Error(errorMsgUnknownAuthor);
            }

            if (author.level > maxLevel) {
                throw new Error(errorMsgPermissions);
            } 
        }
    }

    public async apply(node: Node) {
        await node.storeUser.del(this.userPublicKey);
    }
}
