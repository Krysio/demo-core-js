import WBuffer from "@/libs/WBuffer";
import { createKey, nodeCreator } from "@/tests/helper";
import { AddAdminCommand } from "./add-admin";
import { Admin } from "../users";
import { Frame } from "../frame";

describe('Adding an admin by the root', () => {
    //#region Given
    let testedFrame: WBuffer = null;

    const creator = nodeCreator().manualTime(10001);
    const addingAdminKey = createKey();
    const addingAdminMeta = 'Some text';
    const addingAdmin = new Admin(addingAdminKey, addingAdminMeta);

    test('Create a node', async () => {
        const { node } = creator;

        await node.whenInit();

        node.start();
        
        expect(node.state.isWorking).toBe(true);
    });
    
    test('Create a frame', () => {
        expect(creator.scope.node).not.toBe(null);
        
        const { node } = creator;
        const command = new AddAdminCommand(addingAdmin);
        const frame = new Frame(command);

        frame.setAnchor(0);
        frame.addAuthor(node.rootKey)(node.rootKey.sign(frame.getHash()));

        testedFrame = frame.toBuffer();
    });
    //#endregion Given

    //#region When
    test('Insert the command', () => {
        expect(creator.scope.node).not.toBe(null);
        
        const { node } = creator;

        expect(node.chainTop.getHeight()).toBe(0);

        const result = node.commandParser.receiveCommand(testedFrame);

        expect(result.invalidMsg).toBe(null);
        expect(result.isValid).toBe(true);
    });
    //#endregion When

    //#region Then
    test('Check effects', async () => {
        expect(creator.scope.node).not.toBe(null);
        
        const { node } = creator;

        creator.addTime(10);
        await node.whenChainGrowsTo(1);

        expect(node.chainTop.getHeight()).toBe(1);
        expect(node.commandPool.getByIndex(0).length).toBe(1);

        creator.addTime(20);
        await node.whenChainGrowsTo(3);

        expect(node.chainTop.getHeight()).toBe(3);
        expect(node.commandPool.getByIndex(0).length).toBe(0);

        const result = await node.storeAdmin.get(addingAdmin.publicKey);

        expect(result).not.toBe(null);
    });
    //#endregion Then

    //#region Finally
    afterAll(() => creator.stopNode());
    //#endregion Finally
});
