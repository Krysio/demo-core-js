import { EMPTY_HASH } from "@/libs/crypto/sha256";
import DBSnapshotCommand from "./db-snapshots";

const command = new DBSnapshotCommand(EMPTY_HASH);

test('To & from buffer', () => {
    const buffer1 = command.toBuffer();
    const hash1 = command.getHash();

    command.fromBuffer(buffer1);

    const buffer2 = command.toBuffer();
    const hash2 = command.getHash();
    
    expect(buffer1.isEqual(buffer2)).toBe(true);
    expect(hash1.isEqual(hash2)).toBe(true);
});
