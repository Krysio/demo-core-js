import WBuffer from "@/libs/WBuffer";
import Time from "@/libs/Time";
import config from "@/config";
import { getBlockByHeight } from "./storage/blocks";

const chainTop = new class ChainTop {
    currentHeight = 0;
    hashOfPrevBlock = WBuffer.alloc(32).fill(0);

    getHeight() {
        const { genesisTime, timeBetweenBlocks } = config;

        return Math.floor((Time.now() - genesisTime) / timeBetweenBlocks);
    }

    getTopBlock() {
        return getBlockByHeight(this.getHeight());
    }
};

export default chainTop;
