import { createFakeNode } from "@/tests/helper";
import { createTime } from "./time";

describe('Calc candency number', () => {
    function createTest(givenValue: number, expectValue: number) {
        //#region Given
        const fakeNode = createFakeNode({
            config: { cadencySize: 10  },
            chainTop: { getHeight: () => givenValue },
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
        periodStart: number,
        periodEnd: number,
        expectValue: boolean
    ) {
        //#region Given
        const fakeNode = createFakeNode({
            config: { cadencySize: 10  },
            chainTop: { getHeight: () => givenValue },
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

    createTest(1, 2, 7, false);
    createTest(1, 2, 9, false);
    createTest(1, 2, 10, true);
    createTest(1, 2, 17, true);
    createTest(12, 13, 17, false);
    createTest(12, 13, 22, true);
});
