import { createUser } from "@/tests/helper";
import { User } from "./user";

test('To & from buffer should result the same data', () => {
    //#region Given
    const { user } = createUser();
    //#enregion Given

    //#region When
    const bufferA = user.toBuffer('net');
    const bufferB = new User().parse(bufferA, 'net').toBuffer('net');
    const bufferC = user.toBuffer('db');
    const bufferD = new User().parse(bufferC, 'db').toBuffer('db');
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    expect(bufferC.isEqual(bufferD)).toBe(true);
    //#enregion Then
});
