import { BHTime } from "@/modules/time";
import { VotingSimple } from "./simple";

test('To & from buffer should result the same data', () => {
    //#region Given
    const votingA = new VotingSimple();

    votingA.timeStart = 10 as BHTime;
    votingA.timeEnd = 40 as BHTime;
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
