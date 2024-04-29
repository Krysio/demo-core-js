import { initialConfig } from "@/config";
import main from "@/main";
import db, { dbReady } from "@/storage/db";

test('main.start', async () => {
    main.loadConfig(initialConfig);

    const result = await main.start();

    console.log(result);
});
