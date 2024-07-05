import { Node } from '@/main';

export type BHTime = Brand<number, 'Block Height Time'>;
export type UnixTime = Brand<number, 'Unix Time'>;
export type MS = Brand<number, 'Millisecond'>;

export function createTime(refToNode: unknown) {
    const node = refToNode as Node;
    const { cadencySize } = node.config;

    const module = {
        cadencyNumber: 0,
        getCadencyNumber() { return module.cadencyNumber; },
        calcCadencyNumber() {
            const heightOfChain = node.chainTop.getIndexOfLastBlock();
            const newValue = Math.floor(heightOfChain / cadencySize);

            if (module.cadencyNumber !== newValue) {
                const oldValue = module.cadencyNumber;

                module.cadencyNumber = newValue;

                node.events.emit('cadency/changed', { oldValue, newValue });
            }

            return module.cadencyNumber;
        },
        nowUnix() { return Date.now() as UnixTime; },
        nowBlockHeight() {
            const { genesisTime, timeBetweenBlocks } = node.config;

            if (timeBetweenBlocks === 0) {
                return 0 as BHTime;
            }

            return Math.floor((module.nowUnix() - genesisTime) / timeBetweenBlocks) as BHTime;
        },
        isPeriodBreak(periodStart: BHTime, periodEnd: BHTime) {
            const nextPeriodStart = module.getTimeOfNextCadencyStart();

            if (
                nextPeriodStart > periodStart
                && nextPeriodStart <= periodEnd
            ) {
                return true;
            }

            return false;
        },
        getTimeOfCadencyStart() {
            return (cadencySize * module.cadencyNumber) as BHTime;
        },
        getTimeOfNextCadencyStart() {
            return (cadencySize * (module.cadencyNumber + 1)) as BHTime;
        },
        wait(ms: MS) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        },
        timeToSQL(time: UnixTime) {
            return (new Date(time)).toISOString().replace('T', ' ').substring(0, 19);
        },
    };

    node.events.on('created/block', () => {
        module.calcCadencyNumber();
    });

    return module;
}
