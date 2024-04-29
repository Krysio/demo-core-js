import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_KEY_POOLING } from "./types";
import { Type, CommandTypeMultiUser, ICommandImplementation } from "./command";
import Key from "../key";

@Type(COMMAND_TYPE_KEY_POOLING)
export default class KeyPoolingCommand extends CommandTypeMultiUser implements ICommandImplementation {
    listOfAreas: number[] = [];
    listOfPublicKeys: Key[] = [];
  
    addPublicKey(publicKey: Key) {
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

    addArea(area: number) {
        this.listOfAreas.push(area);
    }

    //#region buffer

    fromBufferImplementation(buffer: WBuffer): void {
        this.listOfAreas = [];
        this.listOfPublicKeys = [];

        const countOfAreas = buffer.readUleb128();
        
        for (let i = 0; i < countOfAreas; i++) {
            this.listOfAreas.push(buffer.readUleb128());
        }

        for (let i = 0; i < this.countOfAuthors; i++) {
            this.listOfPublicKeys.push(Key.fromBuffer(buffer));
        }
    }

    toBufferImplementation(): WBuffer {
        return WBuffer.concat([
            WBuffer.arrayOfUnsignetToBuffer(this.listOfAreas),
            ...this.listOfPublicKeys.map((key) => key.toBuffer())
        ]);
    }

    //#endregion buffer

    isValidImplementation() {
        if (this.listOfAreas.length === 0) return false;
        if (this.listOfPublicKeys.length !== this.countOfAuthors) return false;
        for (const key of this.listOfPublicKeys) {
            if (key.isValid() === false) return false;
        }

        return true;
    }

    async verifyImplementation(): Promise<boolean> {
        return true;
    }

    async getEffectsImplementation(): Promise<void> {}
};
