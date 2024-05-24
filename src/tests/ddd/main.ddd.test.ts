import Time from "@/libs/Time";
import { createNode } from "@/main";

test('Create chain', async () => {
    const timeBetweenBlocks = 1e3;
    const genesisTime = Time.now() - 2 * timeBetweenBlocks - 1;
    const node = createNode({ genesisTime, timeBetweenBlocks });
    const spyCreateBlock = jest.fn();

    node.events.on('created/block', spyCreateBlock);

    await new Promise((resolve) => node.events.on('init/end', () => resolve(null)));

    expect(node.config.timeBetweenBlocks).toBe(timeBetweenBlocks);

    node.start();
    node.stop();

    expect(spyCreateBlock).toBeCalledTimes(3);
    expect(node.chainTop.getIndexOfLastBlock()).toBe(2);
});
