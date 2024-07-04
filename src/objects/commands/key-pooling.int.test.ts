import WBuffer from "@/libs/WBuffer";
import { createKey, nodeCreator } from "@/tests/helper";
import { Frame } from "@/objects/frame";
import { KeyPoolingCommand } from "./key-pooling";
import getLazyPromise from "@/libs/lazyPromise";

describe('Key-pooling of 4 voters', () => {
    //#region Given
    let testedFrame: WBuffer = null;

    const creator = nodeCreator().manualTime(10001);
    const listOfVoterKeys = [createKey(), createKey(), createKey(), createKey()];
    const listOfAddedKeys = [createKey(), createKey(), createKey(), createKey()];

    test('Create a node', async () => {
        const { node } = creator;

        await node.whenInit();

        for (const voterKey of listOfVoterKeys) {
            node.storeVoter.add(voterKey, 0);
        }

        node.start();
        
        expect(node.state.isWorking).toBe(true);
    });
    
    test('Create a frame', () => {
        expect(creator.scope.node).not.toBe(null);

        const command = new KeyPoolingCommand();
        const frame = new Frame(command);

        for (const addingKey of listOfAddedKeys) {
            command.addPublicKey(addingKey);
        }

        frame.setAnchor(0);

        listOfVoterKeys
            .map((voterKey) => ({voterKey, setSignature: frame.addAuthor(voterKey)}))
            .map(({voterKey, setSignature}) => setSignature(voterKey.sign(frame.getHash())))
        ;

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

        creator.addTime(10);
        await node.whenChainGrowsTo(1);

        expect(node.chainTop.getHeight()).toBe(1);
        expect(node.commandPool.getByIndex(0).length).toBe(1);

        creator.addTime(20);
        await node.whenChainGrowsTo(3);

        expect(node.chainTop.getHeight()).toBe(3);
        expect(node.commandPool.getByIndex(0).length).toBe(0);

        await Promise.all(listOfVoterKeys.map((voterKey) => expect(node.storeVoter.get(voterKey)).resolves.toBe(null)));
        await Promise.all(listOfAddedKeys.map((addedKey) => expect(node.storeVoter.get(addedKey)).resolves.not.toBe(null)));
    });
    //#endregion Then

    //#region Finally
    afterAll(() => creator.stopNode());
    //#endregion Finally
});
