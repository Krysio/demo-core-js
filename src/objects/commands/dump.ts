import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_DUMP, mapOfCommand } from "../types";
import { Command } from "./command";

const dumpCommand = new class DumpCommand implements Command {
    typeID = COMMAND_TYPE_DUMP;

    createBuffer(): WBuffer {
        return WBuffer.concat([
            WBuffer.uleb128(COMMAND_TYPE_DUMP)
        ]);
    }

    verifyBlockVersion(buffer: WBuffer, block: any): boolean {
        buffer.cursor = 0;

        const typeID = buffer.readUleb128();

        if (typeID !== COMMAND_TYPE_DUMP) return false; 

        return true;
    }
    verifyNetworkVersion(buffer: WBuffer): boolean {
        return false;
    }
};

mapOfCommand.register(dumpCommand);

export default dumpCommand;
