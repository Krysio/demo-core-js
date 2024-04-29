import Time from "@/libs/Time";

export class Config {
    constructor(
        public genesisTime = 0,
        public timeBetweenBlocks = 0,
        public spaceBetweenDBSnapshot = 0,
        public countOfVoteTransfer = 0,
        public countOfSupportGiving = 0,
        public timeLiveOfUserAccount = 0,
        public timeLiveOfIncognitoAccount = 0,
        public timeBeforeAccountActivation = 0
    ) {}
}

const timeBetweenBlocks = 1e4;

export const initialConfig = new Config(
    Time.now() - timeBetweenBlocks
);

export default Config;
