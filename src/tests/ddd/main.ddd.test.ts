import Time from "@/libs/Time";
import { createNode } from "@/main";
import { createGenesis } from "@/services/genesis";

test('Create chain', async () => {
    const timeBetweenBlocks = 1e3;
    const genesisTime = Time.now() - 2 * timeBetweenBlocks - 1;
    const { genesisBlock } = createGenesis({ genesisTime, timeBetweenBlocks }, { manifest: 'Test' });

    const node = createNode({ genesisBlock });
    const spyCreateBlock = jest.fn();

    node.events.on('created/block', spyCreateBlock);

    await new Promise((resolve) => node.events.on('init/end', () => resolve(null)));

    expect(node.config.timeBetweenBlocks).toBe(timeBetweenBlocks);

    node.start();
    node.stop();

    expect(spyCreateBlock).toBeCalledTimes(2);
    expect(node.chainTop.getIndexOfLastBlock()).toBe(2);
});
