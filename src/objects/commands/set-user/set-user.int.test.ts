import WBuffer from "@/libs/WBuffer";
import { createKey, nodeCreator } from "@/tests/helper";
import { Admin, User } from "@/objects/users";
import { ExFrame } from "@/objects/frame";
import { SetUserCommand } from "./set-user";
import getLazyPromise from "@/libs/lazyPromise";
import { BHTime, MS, UnixTime } from "@/modules/time";

describe('Adding an user by an admin', () => {
    //#region Given
    let testedFrame: WBuffer = null;

    const creator = nodeCreator().manualTime(10001 as UnixTime);
    const addingUserKey = createKey();
    const addingUserMeta = 'Some text';
    const addingUser = new User(addingUserKey, addingUserMeta);

    addingUser.timeStart = 20 as BHTime;
    addingUser.timeEnd = 100 as BHTime;

    test('Create a node', async () => {
        const { node } = creator;

        await node.whenInit();

        node.start();
        
        expect(node.state.isWorking).toBe(true);
    });
    
    test('Create a frame', () => {
        expect(creator.scope.node).not.toBe(null);

        const command = new SetUserCommand(addingUser);
        const frame = new ExFrame(command);
        const admin: Admin = creator.getAdmin();

        frame.setAnchor(0);
        frame.addAuthor(admin.publicKey)(admin.publicKey.sign(frame.getHash()));

        testedFrame = frame.toBuffer('net');
    });
    //#endregion Given

    //#region When
    test('Insert the command', async () => {
        expect(creator.scope.node).not.toBe(null);
        
        const { node } = creator;

        expect(node.chainTop.getHeight()).toBe(0);

        const result = node.commandParser.receiveCommand(testedFrame);

        expect(result.invalidMsg).toBe(null);
        expect(result.isValid).toBe(true);

        const promise = getLazyPromise();

        node.events.once('commandVerifier/acceptCommand', () => promise.resolve());
        node.events.once('commandVerifier/rejectCommand', (frame) => promise.reject(`Cmd rejected: ${frame.invalidMsg}`));

        await promise;
    });
    //#endregion When

    //#region Then
    test('Check effects', async () => {
        expect(creator.scope.node).not.toBe(null);
        
        const { node } = creator;

        creator.addTime(10 as MS);
        await node.whenChainGrowsTo(1);

        expect(node.chainTop.getHeight()).toBe(1);
        expect(node.commandPool.getByIndex(0).length).toBe(1);

        creator.addTime(20 as MS);
        await node.whenChainGrowsTo(3);

        expect(node.chainTop.getHeight()).toBe(3);
        expect(node.commandPool.getByIndex(0).length).toBe(0);

        const result = await node.storeUser.get(addingUser.publicKey);

        expect(result).not.toBe(null);
    });
    //#endregion Then

    //#region Finally
    afterAll(() => creator.stopNode());
    //#endregion Finally
});
