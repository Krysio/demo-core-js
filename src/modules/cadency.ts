import { Node } from '@/main';

export function createCadency(refToNode: unknown) {
    const node = refToNode as Node;
    const { cadencySize } = node.config;

    const module = {
        number: 0,
        getNumber() { return module.number; },
        calcNumber() {
            const heightOfChain = node.chainTop.getHeight();
            const newValue = Math.floor(heightOfChain / cadencySize);

            if (module.number !== newValue) {
                const oldValue = module.number;

                module.number = newValue;

                node.events.emit('cadency/changed', { oldValue, newValue });
            }

            return module.number;
        },
        isPeriodBreak(periodStart: number, periodEnd: number) {
            const nextPeriodStart = cadencySize * (module.number + 1);

            if (
                nextPeriodStart > periodStart
                && nextPeriodStart <= periodEnd
            ) {
                return true;
            }

            return false;
        },
    };

    node.events.on('created/block', () => {
        module.calcNumber();
    });

    return module;
}
