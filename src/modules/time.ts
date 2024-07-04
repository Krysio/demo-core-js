import { Node } from '@/main';

export function createTime(refToNode: unknown) {
    const node = refToNode as Node;
    const { cadencySize } = node.config;

    const module = {
        cadencyNumber: 0,
        now() { return Date.now(); },
        getCadencyNumber() { return module.cadencyNumber; },
        calcCadencyNumber() {
            const heightOfChain = node.chainTop.getHeight();
            const newValue = Math.floor(heightOfChain / cadencySize);

            if (module.cadencyNumber !== newValue) {
                const oldValue = module.cadencyNumber;

                module.cadencyNumber = newValue;

                node.events.emit('cadency/changed', { oldValue, newValue });
            }

            return module.cadencyNumber;
        },
        isPeriodBreak(periodStart: number, periodEnd: number) {
            const nextPeriodStart = module.getHbTimeOfNextCadencyStart();

            if (
                nextPeriodStart > periodStart
                && nextPeriodStart <= periodEnd
            ) {
                return true;
            }

            return false;
        },
        getHbTimeOfCadencyStart() {
            return cadencySize * module.cadencyNumber;
        },
        getHbTimeOfNextCadencyStart() {
            return cadencySize * (module.cadencyNumber + 1);
        },
    };

    node.events.on('created/block', () => {
        module.calcCadencyNumber();
    });

    return module;
}
