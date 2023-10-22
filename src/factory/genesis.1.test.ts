import block from "@/objects/block";
import { createGenesis } from "./genesis";

test("genesisBlock", () => {
    const genesisBlock = createGenesis({
        countOfSupportGiving: 3,
        countOfVoteTransfer: 3,
        regions: [],
        spaceBetweenDumps: 10,
        timeBeforeAccountActivation: 1e3 * 60,
        timeLiveOfIncognitoAccount: 1e3 * 60 * 60 * 24 * 30 * 3,
        timeLiveOfUserAccount: 1e3 * 60 * 60 * 24 * 365 * 3,
        blockGeneration: [[Date.now(), 1e3 * 60 * 5]]
    }, {
        genesisTime: Date.now(),
        manifest: "Text of manifest",
        rootAccounts: [
            { userID: 1, key: '1234' }
        ]
    });

    expect(block.verify(genesisBlock)).toBe(true);
    expect(block.version).toBe(1);
    expect(block.index).toBe(0);
    expect(block.countOfRows).toBe(3);
});
