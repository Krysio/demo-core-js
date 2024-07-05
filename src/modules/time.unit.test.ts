import { createFakeNode } from "@/tests/helper";
import { BHTime, createTime } from "./time";

describe('Calc candency number', () => {
    function createTest(givenValue: number, expectValue: number) {
        //#region Given
        const fakeNode = createFakeNode({
            config: { cadencySize: 10  },
            chainTop: { getIndexOfLastBlock: () => givenValue },
        });
        const module = createTime(fakeNode);
        //#enregion Given

        test(`For {height:${givenValue},cadencySize:${fakeNode.config.cadencySize}} should be ${expectValue}`, () => {
            //#region When & Then
            expect(module.calcCadencyNumber()).toBe(expectValue);
            //#enregion When & Then
        });
    };

    createTest(1, 0);
    createTest(9, 0);
    createTest(10, 1);
    createTest(25, 2);
});

describe('Is period has a break', () => {
    function createTest(
        givenValue: number,
        periodStart: BHTime,
        periodEnd: BHTime,
        expectValue: boolean
    ) {
        //#region Given
        const fakeNode = createFakeNode({
            config: { cadencySize: 10  },
            chainTop: { getIndexOfLastBlock: () => givenValue },
        });
        const module = createTime(fakeNode);
        
        module.calcCadencyNumber();
        //#enregion Given

        test(`For {height:${givenValue},cadencySize:${fakeNode.config.cadencySize}} and period [${periodStart}, ${periodEnd}] should be ${expectValue}`, () => {
            //#region When & Then
            expect(module.isPeriodBreak(periodStart, periodEnd)).toBe(expectValue);
            //#enregion When & Then
        });
    };

    createTest(1, 2 as BHTime, 7 as BHTime, false);
    createTest(1, 2 as BHTime, 9 as BHTime, false);
    createTest(1, 2 as BHTime, 10 as BHTime, true);
    createTest(1, 2 as BHTime, 17 as BHTime, true);
    createTest(12, 13 as BHTime, 17 as BHTime, false);
    createTest(12, 13 as BHTime, 22 as BHTime, true);
});
