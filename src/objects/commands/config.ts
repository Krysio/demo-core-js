import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { COMMAND_TYPE_CONFIG } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX } from ".";
import { Config } from "@/modules/config";
import { Frame } from "@/objects/frame";

@Type(COMMAND_TYPE_CONFIG)
export class ConfigCommand implements ICommand {
    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = true;
    isMultiAuthor = false;
    value = 0;

    public genesisTime: number;
    public timeBetweenBlocks: number;
    public spaceBetweenDBSnapshot: number;
    public countOfVoteTransfer: number;
    public countOfSupportGiving: number;
    public timeLiveOfUserAccount: number;
    public timeLiveOfIncognitoAccount: number;
    public timeBeforeAccountActivation: number;
    
    constructor(config: Config) {
        for (const key in config) {
            this[key as keyof typeof config] = config[key as keyof typeof config];
        }
    }

    public parse(buffer: WBuffer) {
        this.genesisTime = buffer.readUleb128();
        this.timeBetweenBlocks = buffer.readUleb128();
        this.spaceBetweenDBSnapshot = buffer.readUleb128();
        this.countOfVoteTransfer = buffer.readUleb128();
        this.countOfSupportGiving = buffer.readUleb128();
        this.timeLiveOfUserAccount = buffer.readUleb128();
        this.timeLiveOfIncognitoAccount = buffer.readUleb128();
        this.timeBeforeAccountActivation = buffer.readUleb128();

        return this;
    }

    public toBuffer(): WBuffer {
        const genesisTime = WBuffer.uleb128(this.genesisTime);
        const timeBetweenBlocks = WBuffer.uleb128(this.timeBetweenBlocks);
        const spaceBetweenDBSnapshot = WBuffer.uleb128(this.spaceBetweenDBSnapshot);
        const countOfVoteTransfer = WBuffer.uleb128(this.countOfVoteTransfer);
        const countOfSupportGiving = WBuffer.uleb128(this.countOfSupportGiving);
        const timeLiveOfUserAccount = WBuffer.uleb128(this.countOfSupportGiving);
        const timeLiveOfIncognitoAccount = WBuffer.uleb128(this.countOfSupportGiving);
        const timeBeforeAccountActivation = WBuffer.uleb128(this.countOfSupportGiving);
    
        return WBuffer.concat([
            genesisTime,
            timeBetweenBlocks,
            spaceBetweenDBSnapshot,
            countOfVoteTransfer,
            countOfSupportGiving,
            timeLiveOfUserAccount,
            timeLiveOfIncognitoAccount,
            timeBeforeAccountActivation
        ]);
    }

    public async verify(node: Node, frame: Frame) {}
}
