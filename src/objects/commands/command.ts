import WBuffer from "@/libs/WBuffer";
import { mapOfCommand } from "../types";

export interface Command {
    typeID: number;

    createBuffer(...args: any[]): WBuffer;
    verifyBlockVersion(buffer: WBuffer, block: any): boolean;
    verifyNetworkVersion(buffer: WBuffer): boolean;
}

export class CommandInit {
    constructor() {
        //@ts-ignore
        mapOfCommand.set(this.typeID, this as unknown as Command);
    }
}
