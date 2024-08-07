import { UnixTime } from "@/modules/time";
import { nodeCreator } from "@/tests/helper";

test('Create a node', async () => {
    const creator = nodeCreator().manualTime(10001 as UnixTime);
    const { node, scope: { rootKey } } = creator;

    await node.whenInit();
    
    expect(node.state.isWorking).toBe(false);
    expect(node.chainTop.getHeight()).toBe(0);
    expect(node.rootKey.isEqual(rootKey)).toBe(true);

    const { listOfAdmin } = creator.scope;

    for (const [admin] of listOfAdmin) {
        const result = await node.storeAdmin.get(admin.publicKey);
        
        expect(result).not.toBe(null);
    }
});
