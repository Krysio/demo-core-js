import { testingGetRawCore } from "./core";
import { testingGetDefaultInitials } from "./genesis";

describe('State', () => {
  /*
    stop -> activeWork | passiveWork
    activeWork -> passiveWork | stop
    passiveWork -> activeWork | stop

    sync -> unsync
    unsync -> sync

    uninited -> inited
  */
  test('run active', async () => {
    const core = testingGetRawCore();
    const config = testingGetDefaultInitials();

    expect(core.state.isRunningActive()).toBe(false);
    expect(core.state.isRunningPassive()).toBe(false);
    expect(core.state.isInitialized()).toBe(false);

    await core.runActive(config);
    
    expect(core.state.isRunningActive()).toBe(true);
    expect(core.state.isRunningPassive()).toBe(false);
    expect(core.state.isInitialized()).toBe(true);
  });
  test('run passive', async () => {
    const core = testingGetRawCore();
    const config = testingGetDefaultInitials();

    expect(core.state.isRunningActive()).toBe(false);
    expect(core.state.isRunningPassive()).toBe(false);
    expect(core.state.isInitialized()).toBe(false);

    await core.runPassive(config);
    
    expect(core.state.isRunningActive()).toBe(false);
    expect(core.state.isRunningPassive()).toBe(true);
    expect(core.state.isInitialized()).toBe(true);
  });
});
