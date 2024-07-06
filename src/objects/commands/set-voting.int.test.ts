import WBuffer from "@/libs/WBuffer";
import { nodeCreator } from "@/tests/helper";
import { Admin } from "@/objects/users";
import { Frame } from "@/objects/frame";
import { VotingSimple } from "@/objects/voting";
import { SetVotingCommand } from "./set-voting";
import getLazyPromise from "@/libs/lazyPromise";
import { BHTime, MS, UnixTime } from "@/modules/time";

describe('Adding a voting by an admin', () => {
    //#region Given
    let testedFrame: WBuffer = null;

    const creator = nodeCreator().manualTime(10001 as UnixTime);
    const addingVotingMeta = 'Some text';
    const addingVoting = new VotingSimple(
        20 as BHTime,
        100 as BHTime,
        addingVotingMeta
    );

    test('Create a node', async () => {
        const { node } = creator;

        await node.whenInit();

        node.start();
        
        expect(node.state.isWorking).toBe(true);
    });
    
    test('Create a frame', () => {
        expect(creator.scope.node).not.toBe(null);

        const command = new SetVotingCommand(addingVoting);
        const frame = new Frame(command);
        const admin: Admin = creator.getAdmin();

        frame.setAnchor(0);
        frame.addAuthor(admin.publicKey)(admin.publicKey.sign(frame.getHash()));

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

        const result = await node.storeVoting.get(addingVoting.getHash());

        expect(result).not.toBe(null);
    });
    //#endregion Then

    //#region Finally
    afterAll(() => creator.stopNode());
    //#endregion Finally
});
