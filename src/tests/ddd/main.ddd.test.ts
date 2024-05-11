import Time from "@/libs/Time";
import { createNode } from "@/main";

test('Create chain', async () => {
    const timeBetweenBlocks = 1e3;
    const genesisTime = Time.now() - 2 * timeBetweenBlocks - 1;
    const node = createNode({ genesisTime, timeBetweenBlocks });

    expect(node.config.timeBetweenBlocks).toBe(timeBetweenBlocks);

    const spyFn = jest.fn();

    node.events.on('creaed/block', spyFn);

    await new Promise((resolve) => node.events.on('creaed/genesis', resolve));

    node.start();
    node.stop();

    expect(spyFn).toBeCalledTimes(3);
    expect(node.chainTop.getIndexOfLastBlock()).toBe(2);
});
