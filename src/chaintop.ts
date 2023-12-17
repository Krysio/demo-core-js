import WBuffer from "@/libs/WBuffer";
import Time from "@/libs/Time";
import config from "@/config";
import { getBlockByHeight } from "./storage/blocks";
import { EMPTY_HASH } from "./libs/crypto/sha256";

const chainTop = new class ChainTop {
    currentHeight = 0;
    hashOfPrevBlock = EMPTY_HASH;

    getHeight() {
        const { genesisTime, timeBetweenBlocks } = config;

        if (timeBetweenBlocks === 0) {
            return 0;
        }

        return Math.floor((Time.now() - genesisTime) / timeBetweenBlocks);
    }

    getTopBlock() {
        return getBlockByHeight(this.getHeight());
    }
};

export default chainTop;
