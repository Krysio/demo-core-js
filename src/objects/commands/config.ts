import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_CONFIG } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_PRIMARY } from ".";
import { Config } from "@/modules/config";
import { Frame } from "@/objects/frame";

@Type(COMMAND_TYPE_CONFIG)
export class ConfigCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = true;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_PRIMARY;

    public values: Config = {
        genesisTime: 0,
        timeBetweenBlocks: 0,
        cadencySize: 0,
        countOfVoteTransfer: 0,
        countOfSupportGiving: 0,
        timeLiveOfUserAccount: 0,
        timeBeforeAccountActivation: 0,
    };
    
    constructor(config: Partial<Config> = {}) {
        for (const key in config) {
            this.values[key as keyof typeof config] = config[key as keyof typeof config];
        }
    }

    public parse(buffer: WBuffer) {
        this.values.genesisTime = buffer.readUleb128();
        this.values.timeBetweenBlocks = buffer.readUleb128();
        this.values.cadencySize = buffer.readUleb128();
        this.values.countOfVoteTransfer = buffer.readUleb128();
        this.values.countOfSupportGiving = buffer.readUleb128();
        this.values.timeLiveOfUserAccount = buffer.readUleb128();
        this.values.timeBeforeAccountActivation = buffer.readUleb128();

        return this;
    }

    public toBuffer(): WBuffer {
        const genesisTime = WBuffer.uleb128(this.values.genesisTime);
        const timeBetweenBlocks = WBuffer.uleb128(this.values.timeBetweenBlocks);
        const cadencySize = WBuffer.uleb128(this.values.cadencySize);
        const countOfVoteTransfer = WBuffer.uleb128(this.values.countOfVoteTransfer);
        const countOfSupportGiving = WBuffer.uleb128(this.values.countOfSupportGiving);
        const timeLiveOfUserAccount = WBuffer.uleb128(this.values.timeLiveOfUserAccount);
        const timeBeforeAccountActivation = WBuffer.uleb128(this.values.timeBeforeAccountActivation);
    
        return WBuffer.concat([
            genesisTime,
            timeBetweenBlocks,
            cadencySize,
            countOfVoteTransfer,
            countOfSupportGiving,
            timeLiveOfUserAccount,
            timeBeforeAccountActivation
        ]);
    }

    public async verify(node: Node, frame: Frame) {}
}
