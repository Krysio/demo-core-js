import { createFakeNode } from "@/tests/helper";
import { createStoreBlock } from "./storeBlock";
import { Block } from "@/objects/block";
import { EMPTY_HASH } from "@/libs/crypto/sha256";

test('Set & Get', async () => {
    //#region Given
    const fakeNode = createFakeNode();
    const store = createStoreBlock(fakeNode);
    const block = new Block();

    block.hashOfPrevBlock = EMPTY_HASH;
    block.index = 0;
    //#enregion Given

    //#region When
    await store.add(block);

    const hashOfBlock = block.getHash();

    const resultA = await store.getByHash(hashOfBlock);
    const resultB = await store.getByHash(hashOfBlock);
    //#enregion When

    //#region Then
    expect(store.isFsUsed).toBe(false);
    expect(block.toBuffer().isEqual(resultA.toBuffer())).toBe(true);
    expect(resultA.toBuffer().isEqual(resultB.toBuffer())).toBe(true);
    //#enregion Then
});
