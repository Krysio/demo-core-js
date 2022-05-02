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
  });
});
