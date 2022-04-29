import { Core } from "@/main";

/******************************/

export function extendWithState(referenceToCore: unknown) {
  const core = referenceToCore as Core;

  const state = {
    isRanActive: false,
    isRanPassive: false,
    isInitialized: false,
    isSynchronized: false,
    promiseRunningActive: null as Promise<void> | null,
    promiseRunningPassive: null as Promise<void> | null,
    promiseInitializing: null as Promise<void> | null,
    promiseSynchronizing: null as Promise<void> | null
  };

  return { state: {
    isRunningActive: () => state.isRanActive,
    isRunningPassive: () => state.isRanPassive,
    isInitialized: () => state.isInitialized,
    isSynchronized: () => state.isSynchronized,

    goToStateRunningActive() {
      if (state.promiseRunningActive === null) {
        return state.promiseRunningActive = new Promise((resolve, reject) => {
          if (!state.isRanActive) {
            state.promiseRunningPassive = null;
            state.isRanPassive = false;

            core.state.goToStateInitialized()
            .then(() => core.state.goToStateSync())
            .then(() => {
              state.isRanActive = true;
              resolve();
            });
          }
        });
      }

      return state.promiseRunningActive;
    },
    goToStateRunningPassive() {
      if (!state.isRunningActive) {
        state.isRunningActive = true;
        state.isRunningPassive = false;

        core.state.goToStateInitialized();
      }
    },
    goToStateInitialized() {
      if (state.promiseInitializing === null) {
        return state.promiseInitializing = new Promise((resolve, reject) => {
          core.block.createGenesis().then(() => {
            state.isInitialized = true;

            core.state.goToStateSync();
            resolve();
          });
        });
      }

      return state.promiseInitializing;
    },
    goToStateSync() {
      if (state.promiseSynchronizing === null) {
        return state.promiseSynchronizing = new Promise((resolve, reject) => {
          core.blockchain.update().then(() => {
            state.isSynchronized = true;

            resolve();
          });
        });
      }

      return state.promiseSynchronizing;
    },
    updateStateOutOfSync() {
      state.promiseSynchronizing = null;
      state.isSynchronized = false;
    }
  }};
}
