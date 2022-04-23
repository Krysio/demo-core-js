import { testingGetRawCore } from "./core";
import { testingGetDefaultInitials } from "./genesis";

describe('Core', () => {
  test('run', async () => {
    const core = testingGetRawCore();
    const config = testingGetDefaultInitials();

    expect(core.state.isRunning()).toBe(false);
    expect(core.state.isInitialized()).toBe(false);

    await core.run(config);
    
    expect(core.state.isRunning()).toBe(true);
    expect(core.state.isInitialized()).toBe(true);
  });
});
