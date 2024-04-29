import Time from "@/libs/Time";
import Block from "@/objects/Block";
import WBuffer from "@/libs/WBuffer";
import Config from "@/config";
import { MapOfEffects } from "./constants";

export default class ChainTop {
    blockCache: Map<number, {block: Block, effects: MapOfEffects}[]> = new Map();
    currentHeight: number = 0;

    constructor(
        public config: Config
    ) {}

    addBlock(
        block: Block,
        effects: MapOfEffects
    ) {
        const index = block.index;
        const item = {block, effects};
        let existList = this.blockCache.get(index);

        if (existList) {
            existList.push(item);
            existList.sort((a, b) => {
                if (a.block.value == b.block.value) {
                    return WBuffer.compare(
                        a.block.getHash(),
                        b.block.getHash()
                    );
                }
    
                return a.block.value < b.block.value ? 1 : -1;
            });
        } else {
            this.blockCache.set(index, [item]);
        }

        if (this.currentHeight < index) {
            this.currentHeight = index;
        }
    }

    cleanCache() {
        let toClean = this.getHeight() - 3;

        while (this.blockCache.has(toClean)) {
            this.blockCache.delete(toClean);
            toClean--;
        }
    }

    getByIndex(index: number) {
        const list = this.blockCache.get(index);

        if (!list) {
            return null;
        }

        return list;
    }

    getHeight() {
        const { genesisTime, timeBetweenBlocks } = this.config;

        if (timeBetweenBlocks === 0) {
            return 0;
        }

        return Math.floor((Time.now() - genesisTime) / timeBetweenBlocks);
    }
}
