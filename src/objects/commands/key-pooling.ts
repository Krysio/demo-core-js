import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_KEY_POOLING } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Key } from "@/objects/key";
import { Frame } from "../frame";
import { Node } from "@/main";

// 0: current cadency, 1: next cademcy
const flagNextCadency = 1 << 0;

@Type(COMMAND_TYPE_KEY_POOLING)
export class KeyPoolingCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    valueTypeID = TYPE_VALUE_SECONDARY;
    isInternal = false;
    isMultiAuthor = true;
    isValueHasKey = false;

    //#enregion cmd config

    public flags = 0;
    public listOfPublicKeys: Key[] = [];

    public isNextCadency() {
        return !!(this.flags & flagNextCadency);
    }

    //#region buffer

    public parse(buffer: WBuffer) {
        this.flags = buffer.readUleb128();
        this.listOfPublicKeys = [];

        const countOfPublicKeys = buffer.readUleb128();

        for (let i = 0; i < countOfPublicKeys; i++) {
            this.listOfPublicKeys.push(Key.parse(buffer));
        }

        return this;
    }

    public toBuffer(): WBuffer {
        return WBuffer.concat([
            WBuffer.uleb128(this.flags),
            WBuffer.uleb128(this.listOfPublicKeys.length),
            ...this.listOfPublicKeys.map((key) => key.toBuffer())
        ]);
    }

    //#endregion buffer

    public async verify(node: Node, frame: Frame) {
        const isNextCadency = this.isNextCadency();

        for (const { publicKey: authorPublicKey } of frame.authors) {
            const author = isNextCadency
                ? await node.storeVoter.getNext(authorPublicKey)
                : await node.storeVoter.get(authorPublicKey);

            if (author === null) {
                throw new Error('Cmd: Key-pooling: One of authors does not exist');
            }
        }

        for (const publicKey of this.listOfPublicKeys) {
            const result = isNextCadency
                ? await node.storeVoter.getNext(publicKey)
                : await node.storeVoter.get(publicKey);

            if (result !== null) {
                throw new Error('Cmd: Key-pooling: Duplicate key');
            }
        }
    }

    public async apply(node: Node, frame: Frame) {
        const isNextCadency = this.isNextCadency();

        for (const { publicKey: authorPublicKey } of frame.authors) {
            if (isNextCadency) {
                await node.storeVoter.delNext(authorPublicKey);
            } else {
                await node.storeVoter.del(authorPublicKey);
            }
        }

        const heightOfChain = node.chainTop.getHeight();

        for (const publicKey of this.listOfPublicKeys) {
            if (isNextCadency) {
                await node.storeVoter.addNext(publicKey, heightOfChain);
            } else {
                await node.storeVoter.add(publicKey, heightOfChain);
            }
        }
    }
}

export class ExKeyPoolingCommand extends KeyPoolingCommand {
    constructor({
        flags = 0
    } = {}) {
        super();
        if (flags) this.flags = flags;
    }

    public setNextCadency(flag: boolean) {
        this.flags = flag
            ? this.flags | flagNextCadency
            : this.flags & (0xff ^ flagNextCadency);

        return this;
    }

    public addPublicKey(publicKey: Key) {
        if (this.listOfPublicKeys.filter((key) => 
            key.typeID == publicKey.typeID
            && WBuffer.compare(key.key, publicKey.key) === 0
        ).length) {
            return;
        }

        this.listOfPublicKeys.push(publicKey);
        this.listOfPublicKeys.sort((a, b) => {
            if (a.typeID === b.typeID) {
                return WBuffer.compare(a.key, b.key);
            }
        });
    }
}
