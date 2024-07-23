import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_CONFIG } from "../types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_PRIMARY } from "..";
import { Config } from "@/modules/config";

@Type(COMMAND_TYPE_CONFIG)
export class ConfigCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = true;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_PRIMARY;

    //#enregion cmd config

    public data = {} as Config;

    constructor(config: Partial<Config> = {}) {
        Object.assign(this.data, config);
    }

    //#region buffer

    public parse(buffer: WBuffer) {
        const sizeOfJsonString = buffer.readUleb128();
        const jsonString = buffer.read(sizeOfJsonString).utf8();
        const config = JSON.parse(jsonString);

        Object.assign(this.data, config);

        return this;
    }

    public toBuffer(): WBuffer {
        const jsonString = JSON.stringify(this.data);
    
        return WBuffer.concat([
            WBuffer.uleb128(jsonString.length),
            WBuffer.from(jsonString, 'utf8')
        ]);
    }

    //#enregion buffer

    public async verify() {}
}
