import { Command } from "./commands/command";

export const COMMAND_TYPE_GENESIS = 0;
export const COMMAND_TYPE_CONFIG = 1;
export const COMMAND_TYPE_DUMP = 2;

export const mapOfCommand = new class CommandMap extends Map<number, Command> {
    register(command: Command) {
        this.set(command.typeID, command);
    }
};
