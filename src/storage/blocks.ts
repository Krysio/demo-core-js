import WBuffer from "@/libs/WBuffer";
import Block from "@/objects/Block";

export default class StoreBlocks {
    fakeByIndex: Map<number, WBuffer[]> = new Map();
    fakeByHash: Map<string, WBuffer> = new Map();

    add(block: Block) {
        const hexKey = block.getHash().hex();
        const exist = this.fakeByHash.get(hexKey);
        const existList: WBuffer[] = this.fakeByIndex.get(block.index);

        if (exist) {
            throw new Error();
        }

        const buffer = block.toBuffer();

        if (existList) {
            existList.push(buffer);
        } else {
            this.fakeByIndex.set(block.index, [buffer]);
        }

        this.fakeByHash.set(hexKey, buffer);
    }

    getByHeight(height: number): Block[] {
        console.log('TODO');
        return [];
    }

    isExist(hash: WBuffer) {
        console.log('TODO');
        return true;
    }
}
