import Time from "@/libs/Time";

const config = {
    genesisTime: Time.now(),
    timeBetweenBlocks: 0,
    spaceBetweenDBSnapshot: 0,
    countOfVoteTransfer: 0,
    countOfSupportGiving: 0,
    timeLiveOfUserAccount: 0,
    timeLiveOfIncognitoAccount: 0,
    timeBeforeAccountActivation: 0
};

export const initialConfig = {
    genesisTime: Time.now(),
    timeBetweenBlocks: 1e4,
    spaceBetweenDBSnapshot: 100,
    countOfVoteTransfer: 5,
    countOfSupportGiving: 5,
    timeLiveOfUserAccount: 1e6,
    timeLiveOfIncognitoAccount: 1e5,
    timeBeforeAccountActivation: 10
};

export default config;
export type Config = typeof config;
