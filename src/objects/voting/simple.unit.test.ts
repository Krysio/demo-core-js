import { VotingSimple } from "./simple";

test('To & from buffer should result the same data', () => {
    //#region Given
    const votingA = new VotingSimple();

    votingA.timeStart = 10;
    votingA.timeEnd = 40;
    //#enregion Given

    //#region When
    const bufferA = votingA.toBuffer();
    const votingB = new VotingSimple().parse(bufferA);
    const bufferB = votingB.toBuffer();
    //#enregion When

    //#region Then
    expect(bufferA.isEqual(bufferB)).toBe(true);
    //#enregion Then
});
