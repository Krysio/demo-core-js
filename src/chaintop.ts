import WBuffer from "@/libs/WBuffer";

const chainTop = new class ChainTop {
    currentHeight = 0;
    hashOfPrevBlock = WBuffer.alloc(32).fill(0);
};

export default chainTop;