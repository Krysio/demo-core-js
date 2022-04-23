import { Core } from "@/main";

/******************************/

export type RunConfig = {
  genesisTime: Number,
  blockPeriod: Number,
  rootPublicKey: String
};

export function extendWithRun(referenceToCore: unknown) {
  const core = referenceToCore as Core;

  return {
    config: {} as RunConfig,
    run(config = {} as RunConfig): void {
      if (!core.state.isRunning()) {
        core.config = config;
        core.state.goToStateRunning();
      }
    }
  };
};
