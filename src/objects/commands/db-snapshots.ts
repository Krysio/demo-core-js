import WBuffer from "@/libs/WBuffer";
import { Type, CommandTypeInternal, ICommandImplementation } from "./command";
import { COMMAND_TYPE_DB_SNAPSHOT } from "./types";

@Type(COMMAND_TYPE_DB_SNAPSHOT)
export default class DBSnapshotCommand extends CommandTypeInternal implements ICommandImplementation {
    constructor(
        public hashOfUsersDB: WBuffer
    ) { super(); }

    fromBufferImplementation(
        buffer: WBuffer
    ): void {
        this.hashOfUsersDB = buffer.read(32);
    }
    
    toBufferImplementation(): WBuffer {
        return WBuffer.concat([
            this.hashOfUsersDB
        ]);
    }

    isValidImplementation(): boolean {
        if (this.hashOfUsersDB.length !== 32) {
            return false;
        }

        return true;
    }

    async verifyImplementation(): Promise<boolean> {
        return true;
    }

    async applyImplementation(): Promise<void> {}
};
