import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_CONFIG } from "./types";
import { Type, CommandTypeInternal, ICommandImplementation } from "./command";
import { Config } from "@/config";

@Type(COMMAND_TYPE_CONFIG)
export default class ConfigCommand extends CommandTypeInternal implements ICommandImplementation {
    public genesisTime: number;
    public timeBetweenBlocks: number;
    public spaceBetweenDBSnapshot: number;
    public countOfVoteTransfer: number;
    public countOfSupportGiving: number;
    public timeLiveOfUserAccount: number;
    public timeLiveOfIncognitoAccount: number;
    public timeBeforeAccountActivation: number;
    
    constructor(config: Config) {
        super();
        this.genesisTime = config.genesisTime;
        this.timeBetweenBlocks = config.timeBetweenBlocks;
        this.spaceBetweenDBSnapshot = config.spaceBetweenDBSnapshot;
        this.countOfVoteTransfer = config.countOfVoteTransfer;
        this.countOfSupportGiving = config.countOfSupportGiving;
        this.timeLiveOfUserAccount = config.timeLiveOfUserAccount;
        this.timeLiveOfIncognitoAccount = config.timeLiveOfIncognitoAccount;
        this.timeBeforeAccountActivation = config.timeBeforeAccountActivation;
    }

    fromBufferImplementation(buffer: WBuffer): void {
        this.genesisTime = buffer.readUleb128();
        this.timeBetweenBlocks = buffer.readUleb128();
        this.spaceBetweenDBSnapshot = buffer.readUleb128();
        this.countOfVoteTransfer = buffer.readUleb128();
        this.countOfSupportGiving = buffer.readUleb128();
        this.timeLiveOfUserAccount = buffer.readUleb128();
        this.timeLiveOfIncognitoAccount = buffer.readUleb128();
        this.timeBeforeAccountActivation = buffer.readUleb128();
    }

    toBufferImplementation(): WBuffer {
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

    isValidImplementation(): boolean {
        try {
            
        } catch (error) {
            return false;
        }

        return true;
    }
}
