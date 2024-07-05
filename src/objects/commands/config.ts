import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_CONFIG } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_PRIMARY } from ".";
import { Config } from "@/modules/config";
import { Frame } from "@/objects/frame";
import { BHTime, MS, UnixTime } from "@/modules/time";

@Type(COMMAND_TYPE_CONFIG)
export class ConfigCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = true;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_PRIMARY;

    public values: Config = {
        genesisTime: 0 as UnixTime,
        timeBetweenBlocks: 0 as MS,
        cadencySize: 0 as BHTime,
        countOfVoteTransfer: 0,
        countOfSupportGiving: 0,
        timeLiveOfUserAccount: 0 as BHTime,
        timeBeforeAccountActivation: 0 as BHTime,
    };
    
    constructor(config: Partial<Config> = {}) {
        for (const key in config) {
            //@ts-ignore
            this.values[key] = config[key];
        }
    }

    public parse(buffer: WBuffer) {
        this.values.genesisTime = buffer.readUleb128() as UnixTime;
        this.values.timeBetweenBlocks = buffer.readUleb128() as MS;
        this.values.cadencySize = buffer.readUleb128() as BHTime;
        this.values.countOfVoteTransfer = buffer.readUleb128();
        this.values.countOfSupportGiving = buffer.readUleb128();
        this.values.timeLiveOfUserAccount = buffer.readUleb128() as BHTime;
        this.values.timeBeforeAccountActivation = buffer.readUleb128() as BHTime;

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
