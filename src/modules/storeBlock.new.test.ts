import { createUser, createKey, createFakeNode } from "@/tests/helper";
import { createStoreBlock } from "./storeBlock";

test('', () => {
    const fakeNode = createFakeNode();
    const store = createStoreBlock(fakeNode);

    expect(store.isFsUsed).toBe(false);
});
