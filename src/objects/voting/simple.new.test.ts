import { VotingSimple } from "./simple";

test('To & from buffer should result the same data', () => {
    //#region Given
    const voting = new VotingSimple();
    //#enregion Given

    //#region When
    const bufferA = voting.toBuffer();
    const bufferB = new VotingSimple().parse(bufferA).toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});
