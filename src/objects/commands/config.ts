import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_CONFIG, mapOfCommand } from "../types";
import { Command } from "./command";

export type Config = {
    blockGeneration: [number, number][],
    spaceBetweenDumps: number,

    countOfVoteTransfer: number,
    countOfSupportGiving: number,
    timeLiveOfUserAccount: number,
    timeLiveOfIncognitoAccount: number,

    timeBeforeAccountActivation: number,
    regions: number[]
    /*
        0: Global

        1
    */
};

const configCommand = new class ConfigCommand implements Command {
    typeID = COMMAND_TYPE_CONFIG;

    createBuffer(config: Config): WBuffer {
        const jsonString = WBuffer.from(JSON.stringify(config), 'utf-8');
    
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
            const json = JSON.parse(jsonString) as Config;
            
            if (!Array.isArray(json.blockGeneration)) return false;
            if (json.blockGeneration.length === 0) return false;
            
            for (const item of json.blockGeneration) {
                if (!Array.isArray(item)) return false;
                if (item.length !== 2) return false;

                const [timeStart, timePeriod] = item;

                if (typeof timeStart !== 'number') return false;
                if (typeof timePeriod !== 'number') return false;
                if (timePeriod < 1e3 * 60) return false;
            }
        } catch (error) {
            return false;
        }

        return true;
    }
    verifyNetworkVersion(buffer: WBuffer): boolean {
        return false;
    }
};

mapOfCommand.register(configCommand);

export default configCommand;
