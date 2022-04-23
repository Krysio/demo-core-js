import { Core } from "@/main";

/******************************/

export function extendWithState(referenceToCore: unknown) {
  const core = referenceToCore as Core;

  const state = {
    isRunning: false,
    isInitialized: false,
    isSynchronized: false,
    promiseInitializing: null as Promise<void> | null,
    promiseSynchronizing: null as Promise<void> | null
  };

  return { state: {
    isRunning: () => state.isRunning,
    isInitialized: () => state.isInitialized,
    isSynchronized: () => state.isSynchronized,

    goToStateRunning() {
      if (!state.isRunning) {
        state.isRunning = true;

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
