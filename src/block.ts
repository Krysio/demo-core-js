import { Core } from "@/main";
import Block from "@/data/block";

/******************************/

export function extendWithBlock(referenceToCore: unknown) {
  const core = referenceToCore as Core;

  return { block: {
    async createGenesis() {
      const block = new Block();
    }
  }};
}