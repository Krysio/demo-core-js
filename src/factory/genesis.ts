import WBuffer from "@/libs/WBuffer";
import configCommand, { Config } from "@/objects/commands/config";
import genesisCommand, { Genesis } from "@/objects/commands/genesis";
import dumpCommand from "@/objects/commands/dump";

export function createGenesis(
    config: Config,
    genesis: Genesis
) {
    const commandConfig = configCommand.createBuffer(config);
    const commendGenesis = genesisCommand.createBuffer(genesis);
    const commandDump = dumpCommand.createBuffer();

    return WBuffer.concat([
        WBuffer.uleb128(1), // version
        WBuffer.uleb128(0), // index
        WBuffer.alloc(32).fill(0), // hashOfPrevBlock - empty
        WBuffer.uleb128(3), // countOfRows
        WBuffer.uleb128(commandConfig.length), commandConfig,
        WBuffer.uleb128(commendGenesis.length), commendGenesis,
        WBuffer.uleb128(commandDump.length), commandDump,
    ]);
}
