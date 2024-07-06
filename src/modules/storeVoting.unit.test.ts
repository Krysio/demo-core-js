import { createRandomHash } from "@/tests/helper";
import { createStoreVoting } from "./storeVoting";
import { VotingSimple } from "@/objects/voting";
import { BHTime } from "./time";

test('Swap', () => {
    //#region Given
    const store = createStoreVoting();
    const refToCurrent = store.storeCurrent;
    const refToNext = store.storeNext;
    //#enregion Given

    //#region When
    store.swip();
    //#enregion When

    //#region Then
    expect(store.storeCurrent).not.toBe(refToCurrent);
    expect(store.storeNext).not.toBe(refToNext);
    expect(store.storeCurrent).toBe(refToNext);
    //#enregion Then
});

describe('Set & Get', () => {
    test('Into current', async () => {
        //#region Given
        const store = createStoreVoting();
        const voting = new VotingSimple(10 as BHTime, 20 as BHTime, 'meta');
        const votingHash = voting.getHash();
        const votingStr = voting.toString();
        //#enregion Given

        //#region When
        await store.set(voting);

        const resultA = await store.get(votingHash);
        const resultB = await store.get(votingHash);
        const resultC = await store.get(createRandomHash());
        //#enregion When

        //#region Then
        expect(resultA.toString()).toBe(votingStr);
        expect(resultB.toString()).toBe(votingStr);
        expect(resultC).toBe(null);
        //#enregion Then
    });

    test('Into next', async () => {
        //#region Given
        const store = createStoreVoting();
        const voting = new VotingSimple(10 as BHTime, 20 as BHTime, 'meta');
        const votingHash = voting.getHash();
        const votingStr = voting.toString();
        //#enregion Given

        //#region When
        await store.setNext(voting);
        store.swip();

        const resultA = await store.get(votingHash);
        const resultB = await store.get(votingHash);
        const resultC = await store.get(createRandomHash());
        //#enregion When

        //#region Then
        expect(resultA.toString()).toBe(votingStr);
        expect(resultB.toString()).toBe(votingStr);
        expect(resultC).toBe(null);
        //#enregion Then
    });
});
