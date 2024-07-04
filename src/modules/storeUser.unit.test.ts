import { createUser, createKey, createFakeNode } from "@/tests/helper";
import { createStoreUser } from "./storeUser";

test('Set & Get', async () => {
    //#region Given
    const fakeNode = createFakeNode();
    const store = createStoreUser(fakeNode);
    const timeStart = 13;
    const timeEnd = 1340;
    const metaData = 'Test of storeUser';
    const parentKey = createKey();
    const { user, key: userPublicKey } = createUser({ timeStart, timeEnd, metaData, parentKey });

    //#enregion Given

    //#region When
    await store.add(user);

    const resultA = await store.get(user.publicKey);
    const resultB = await store.get(user.publicKey);
    //#enregion When

    //#region Then
    const buffer = user.toBuffer();

    expect(buffer.isEqual(resultA.toBuffer())).toBe(true);
    expect(buffer.isEqual(resultB.toBuffer())).toBe(true);
    expect(resultA.timeStart).toBe(timeStart);
    expect(resultA.timeEnd).toBe(timeEnd);
    expect(resultA.metaData).toBe(metaData);
    //#enregion Then
});
