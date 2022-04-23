import { extendWithState } from '@/state';
import { extendWithBlock } from '@/block';
import { extendWithRun } from '@/run';
import { extendWithBlockChain } from './blockchain';

/******************************/

export function createCore() {
  const referenceToCore = {};

  const core = Object.assign(referenceToCore, {
    ...extendWithRun(referenceToCore),
    ...extendWithState(referenceToCore),
    ...extendWithBlock(referenceToCore),
    ...extendWithBlockChain(referenceToCore)
  });

  return core;
}
export type Core = ReturnType<typeof createCore>;
