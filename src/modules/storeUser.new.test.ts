import { Node } from "@/main";
import { createStoreUser } from "./storeUser";
import { EventEmitter } from "stream";
import { createUser, createKey } from "@/objects/commands/test.helper";

test('Set & Get', async () => {
    const fakeNode = {
        events: new EventEmitter() as Node['events'],
    } as Node;
    const store = createStoreUser(fakeNode);
    const { user } = createUser();
    const parentPublicKey = createKey();

    user.parentPublicKey = parentPublicKey;
    await store.add(user);

    const resultA = await store.get(user.publicKey);
    const resultB = await store.get(user.publicKey);
    const adminBuffer = user.toBuffer();

    expect(adminBuffer.isEqual(resultA.toBuffer())).toBe(true);
    expect(adminBuffer.isEqual(resultB.toBuffer())).toBe(true);
});
