import { Core } from "@/main";
import { EventEmitter } from "events";

/******************************/

export type BaseStateEvents = 'Stop' | 'ActiveWork' | 'PassiveWork';
export type StateEvents = BaseStateEvents
 | 'Stop/Start' | 'Stop/End'
 | 'ActiveWork/Start' | 'ActiveWork/End'
 | 'PassiveWork/Start' | 'PassiveWork/End'
;

/******************************/

export function extendWithState(referenceToCore: unknown) {
  const core = referenceToCore as Core;

  const eventEmmiter = new EventEmitter();

  const state = {
    workMode: null as 'active' | 'passive',
    promiseGoToActiveWork: null as Promise<void> | null,
    promiseGoToPassiveWork: null as Promise<void> | null,
    promiseGoToStop: null as Promise<void> | null,
  
    promiseInitializing: null as Promise<void> | null,
    promiseSynchronizing: null as Promise<void> | null
  };

  const emit = (eventName: StateEvents) => {
    return Promise.all(eventEmmiter.listeners(eventName).map((handler) => handler()));
  };

  return { state: {
    on(eventName: StateEvents, eventHandler: () => Promise<void> | undefined) {
      eventEmmiter.on(eventName, eventHandler);
    },

    async goToStateActiveWork() {
      await emit('Stop/End');
      await emit('ActiveWork/Start');
      state.workMode = "active";
      emit('ActiveWork');
    },
    async goToStatePassiveWork() {
      await emit('Stop/End');
      await emit('PassiveWork/Start');
      state.workMode = "passive";
      emit('PassiveWork');
    },
    async goToStateStop() {
      switch (state.workMode) {
        case "active": await emit('ActiveWork/End'); break;
        case "passive": await emit('PassiveWork/End'); break;
      }
      await emit('Stop/Start');
      state.workMode = null;
      emit('Stop');
    }
  }};
}
