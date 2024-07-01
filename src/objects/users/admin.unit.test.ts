import { createAdmin } from "@/tests/helper";
import { Admin } from "./admin";

test('To & from buffer should result the same data', () => {
    //#region Given
    const { admin } = createAdmin();
    //#enregion Given

    //#region When
    const bufferA = admin.toBuffer('net');
    const bufferB = new Admin().parse(bufferA, 'net').toBuffer('net');
    const bufferC = admin.toBuffer('db');
    const bufferD = new Admin().parse(bufferC, 'db').toBuffer('db');
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    expect(bufferC.isEqual(bufferD)).toBe(true);
    //#enregion Then
});
