import { createUser, createKey, createFakeNode } from "@/tests/helper";
import { createStoreUser } from "./storeUser";
import { BHTime } from "./time";

test('Set & Get', async () => {
    //#region Given
    const fakeNode = createFakeNode();
    const store = createStoreUser(fakeNode);
    const timeStart = 13 as BHTime;
    const timeEnd = 1340 as BHTime;
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
