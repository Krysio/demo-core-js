import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_KEY_POOLING } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_SECONDARY } from ".";
import { Key } from "@/objects/key";
import { Frame } from "../frame";
import { Node } from "@/main";

@Type(COMMAND_TYPE_KEY_POOLING)
export class KeyPoolingCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    valueTypeID = TYPE_VALUE_SECONDARY;
    isInternal = false;
    isMultiAuthor = true;
    isValueHasKey = false;

    //#enregion cmd config

    public listOfPublicKeys: Key[] = [];
  
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

    //#region buffer

    public parse(buffer: WBuffer) {
        this.listOfPublicKeys = [];

        const countOfPublicKeys = buffer.readUleb128();

        for (let i = 0; i < countOfPublicKeys; i++) {
            this.listOfPublicKeys.push(Key.parse(buffer));
        }

        return this;
    }

    public toBuffer(): WBuffer {
        return WBuffer.concat([
            WBuffer.uleb128(this.listOfPublicKeys.length),
            ...this.listOfPublicKeys.map((key) => key.toBuffer())
        ]);
    }

    //#endregion buffer

    public async verify(node: Node, frame: Frame) {
        for (const { publicKey: authorPublicKey } of frame.authors) {
            const author = await node.storeVoter.get(authorPublicKey);

            if (author === null) {
                throw new Error('Cmd: Key-pooling: One of authors does not exist');
            }
        }

        for (const publicKey of this.listOfPublicKeys) {
            const result = await node.storeVoter.get(publicKey);
    
            if (result !== null) {
                throw new Error('Cmd: Key-pooling: Duplicate key');
            }
        }
    }

    public async apply(node: Node, frame: Frame) {
        for (const { publicKey: authorPublicKey } of frame.authors) {
            await node.storeVoter.del(authorPublicKey);
        }

        const heightOfChain = node.chainTop.getHeight();

        for (const publicKey of this.listOfPublicKeys) {
            await node.storeVoter.add(publicKey, heightOfChain);
        }
    }
};
