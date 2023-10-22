import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_GENESIS, mapOfCommand } from "../types";
import { Command } from "./command";

export type Genesis = {
    manifest: string,
    genesisTime: number,
    rootAccounts: {
        userID: number,
        key: string
    }[]
};

const genesisCommand = new class GenesisCommand implements Command {
    typeID = COMMAND_TYPE_GENESIS;

    createBuffer(genesis: Genesis) {
        const jsonString = WBuffer.from(JSON.stringify(genesis), 'utf-8');

        return WBuffer.concat([
            WBuffer.uleb128(this.typeID),
            WBuffer.uleb128(jsonString.length),
            jsonString
        ]);
    }

    verifyBlockVersion(buffer: WBuffer, block: any): boolean {
        buffer.cursor = 0;
        try {
            const typeID = buffer.readUleb128();
            const jsonStringSize = buffer.readUleb128();

            if (typeID !== this.typeID) return false; 
            if (jsonStringSize === 0) return false;
            if (buffer.cursor + jsonStringSize !== buffer.length) return false;

            const jsonString = buffer.read(jsonStringSize).toString('utf-8');
            const json = JSON.parse(jsonString);

            // TODO check manifest is string
            // TODO check rootAccounts
        } catch (error) {
            return false;
        }

        return true;
    }

    verifyNetworkVersion(buffer: WBuffer): boolean {
        return false;
    }
};

mapOfCommand.register(genesisCommand);

export default genesisCommand;
