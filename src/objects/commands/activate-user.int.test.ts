import WBuffer from "@/libs/WBuffer";
import getLazyPromise from "@/libs/lazyPromise";
import { createUser, nodeCreator } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { ActivateUserCommand } from "./activate-user";
import { BHTime, MS, UnixTime } from "@/modules/time";

describe('Activate a user account in the current cadency', () => {
    //#region Given
    let testedFrame: WBuffer = null;

    const creator = nodeCreator().manualTime(10001 as UnixTime);
    const { user, key: userPublicKey } = createUser({ timeStart: 0 as BHTime });

    test('Create a node', async () => {
        const { node } = creator;

        await node.whenInit();
        await node.storeUser.set(user);

        node.start();
        
        expect(node.state.isWorking).toBe(true);
    });
    
    test('Create a frame', () => {
        expect(creator.scope.node).not.toBe(null);

        const command = new ActivateUserCommand(0);
        const frame = new Frame(command);

        frame.setAnchor(0);
        frame.addAuthor(userPublicKey)(userPublicKey.sign(frame.getHash()));

        testedFrame = frame.toBuffer();
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

        const result = await node.storeVoter.get(userPublicKey);

        expect(result).not.toBe(null);
    });
    //#endregion Then

    //#region Finally
    afterAll(() => creator.stopNode());
    //#endregion Finally
});

describe('Activate a user account in the next cadency', () => {
    //#region Given
    let testedFrame: WBuffer = null;

    const creator = nodeCreator().manualTime(10001 as UnixTime);
    const { user, key: userPublicKey } = createUser({ timeStart: 0 as BHTime });

    test('Create a node', async () => {
        const { node } = creator;

        await node.whenInit();
        await node.storeUser.set(user);

        node.start();
        
        expect(node.state.isWorking).toBe(true);
    });
    
    test('Create a frame', () => {
        expect(creator.scope.node).not.toBe(null);

        const command = new ActivateUserCommand(1);
        const frame = new Frame(command);

        frame.setAnchor(0);
        frame.addAuthor(userPublicKey)(userPublicKey.sign(frame.getHash()));

        testedFrame = frame.toBuffer();
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

        const result = await node.storeVoter.getNext(userPublicKey);

        expect(result).not.toBe(null);
    });
    //#endregion Then

    //#region Finally
    afterAll(() => creator.stopNode());
    //#endregion Finally
});