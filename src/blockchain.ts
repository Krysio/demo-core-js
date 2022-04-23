import { Core } from "@/main";

/******************************/

export function extendWithBlockChain(referenceToCore: unknown) {
  const core = referenceToCore as Core;

  return { blockchain: {
    async update() {}
  }};
}