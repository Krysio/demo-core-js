import { createUser, createKey, createFakeNode } from "@/tests/helper";
import { createStoreUser } from "./storeUser";

test('Set & Get', async () => {
    //#region Given
    const fakeNode = createFakeNode();
    const store = createStoreUser(fakeNode);
    const { user } = createUser();
    const parentPublicKey = createKey();

    user.parentPublicKey = parentPublicKey;
    //#enregion Given

    //#region When
    await store.add(user);

    const resultA = await store.get(user.publicKey);
    const resultB = await store.get(user.publicKey);
    //#enregion When

    //#region Then
    const adminBuffer = user.toBuffer();

    expect(adminBuffer.isEqual(resultA.toBuffer())).toBe(true);
    expect(adminBuffer.isEqual(resultB.toBuffer())).toBe(true);
    //#enregion Then
});
