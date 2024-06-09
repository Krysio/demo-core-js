import { createAdmin, createKey, createFakeNode } from "@/tests/helper";
import { createStoreAdmin } from "./storeAdmin";

test('Set & Get', async () => {
    //#region Given
    const fakeNode = createFakeNode();
    const store = createStoreAdmin(fakeNode);
    const { admin } = createAdmin();
    const parentPublicKey = createKey();

    admin.parentPublicKey = parentPublicKey;
    //#enregion Given

    //#region When
    await store.add(admin);

    const resultA = await store.get(admin.publicKey);
    const resultB = await store.get(admin.publicKey);
    //#enregion When

    //#region Then
    const adminBuffer = admin.toBuffer();

    expect(adminBuffer.isEqual(resultA.toBuffer())).toBe(true);
    expect(adminBuffer.isEqual(resultB.toBuffer())).toBe(true);
    //#enregion Then
});
