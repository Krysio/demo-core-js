import { Node } from "@/main";
import { createStoreAdmin } from "./storeAdmin";
import { EventEmitter } from "stream";
import { createAdmin, createKey } from "@/objects/commands/test.helper";

test('Set & Get', async () => {
    const fakeNode = {
        events: new EventEmitter() as Node['events'],
    } as Node;
    const store = createStoreAdmin(fakeNode);
    const { admin } = createAdmin();
    const parentPublicKey = createKey();

    admin.parentPublicKey = parentPublicKey;
    await store.add(admin);

    const resultA = await store.get(admin.publicKey);
    const resultB = await store.get(admin.publicKey);
    const adminBuffer = admin.toBuffer();

    expect(adminBuffer.isEqual(resultA.toBuffer())).toBe(true);
    expect(adminBuffer.isEqual(resultB.toBuffer())).toBe(true);
});
