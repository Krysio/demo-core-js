import ConfigCommand from "./config";
import config from "@/config";

const command = new ConfigCommand(config);

test('To & from buffer', () => {
    const buffer1 = command.toBuffer();
    const hash1 = command.getHash();

    command.fromBuffer(buffer1);

    const buffer2 = command.toBuffer();
    const hash2 = command.getHash();
    
    expect(buffer1.isEqual(buffer2)).toBe(true);
    expect(hash1.isEqual(hash2)).toBe(true);
});
