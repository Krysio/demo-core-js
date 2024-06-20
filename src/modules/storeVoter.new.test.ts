import { createFakeNode, createKey } from "@/tests/helper";
import { createStoreVoter } from "./storeVoter";

test('Swap', () => {
    //#region Given
    const fakeNode = createFakeNode();
    const store = createStoreVoter(fakeNode);
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
        const fakeNode = createFakeNode();
        const store = createStoreVoter(fakeNode);
        const voterKey = createKey();
        //#enregion Given

        //#region When
        await store.add(voterKey, 10);

        const resultA = await store.get(voterKey);
        const resultB = await store.get(voterKey);
        const resultC = await store.get(createKey());
        //#enregion When

        //#region Then
        expect(resultA).toBe(10);
        expect(resultB).toBe(10);
        expect(resultC).toBe(null);
        //#enregion Then
    });

    test('Into next', async () => {
        //#region Given
        const fakeNode = createFakeNode();
        const store = createStoreVoter(fakeNode);
        const voterKey = createKey();
        //#enregion Given

        //#region When
        await store.addNext(voterKey, 10);
        store.swip();

        const resultA = await store.get(voterKey);
        const resultB = await store.get(voterKey);
        const resultC = await store.get(createKey());
        //#enregion When

        //#region Then
        expect(resultA).toBe(10);
        expect(resultB).toBe(10);
        expect(resultC).toBe(null);
        //#enregion Then
    });
});
