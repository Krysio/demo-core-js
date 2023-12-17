import main from "@/main";
import db, { dbReady } from "@/storage/db";

test('main.start', async () => {
    const result = await main.start();

    console.log(result);
});
