import { createBlockerPromise, nextTickPromise } from './helpers/promise';
import { Core } from './main';
import { extendWithState, BaseStateEvents } from './state';

/*
stop -> activeWork | passiveWork
activeWork -> passiveWork | stop
passiveWork -> activeWork | stop

sync -> unsync
unsync -> sync

uninited -> inited
*/

/******************************/

const createCore = () => {
    const core = {};
    return Object.assign(core, { ...extendWithState(core) });
};

function testStateChange(state: Core['state'], prevState: BaseStateEvents, nextState: BaseStateEvents, blockerPromise: Promise<void>) {
    const fnEnd = jest.fn(nextTickPromise);
    const fnStart = jest.fn(nextTickPromise);
    const fnSetState = jest.fn();

    state.on(`${prevState}/End`, fnEnd);
    state.on(`${nextState}/Start`, fnStart);
    state.on(`${nextState}`, fnSetState);

    test(`Should be fired event "${prevState}/end"`, async () => { await blockerPromise; expect(fnEnd).toBeCalledTimes(1)});
    test(`Should be fired event "${nextState}/start"`, async () => { await blockerPromise; expect(fnStart).toBeCalledTimes(1)});
    test(`Should be fired event "${nextState}"`, async () => { await blockerPromise; expect(fnSetState).toBeCalledTimes(1)});
}

/******************************/

describe('State change', () => {
    describe('Stop -> ActiveWork -> Stop', () => {
        const core = createCore();
        const blockerPromise1 = createBlockerPromise();
        const blockerPromise2 = createBlockerPromise();

        testStateChange(core.state, 'Stop', 'ActiveWork', blockerPromise1);
        testStateChange(core.state, 'ActiveWork', 'Stop', blockerPromise2);

        (async () => {
            await core.state.goToStateActiveWork();
            blockerPromise1.resolve();
            await core.state.goToStateStop();
            blockerPromise2.resolve();
        })();
    });

    describe('Stop -> PassiveWork -> Stop', () => {
        const core = createCore();
        const blockerPromise1 = createBlockerPromise();
        const blockerPromise2 = createBlockerPromise();

        testStateChange(core.state, 'Stop', 'PassiveWork', blockerPromise1);
        testStateChange(core.state, 'PassiveWork', 'Stop', blockerPromise2);

        (async () => {
            await core.state.goToStatePassiveWork();
            blockerPromise1.resolve();
            await core.state.goToStateStop();
            blockerPromise2.resolve();
        })();
    });
});
