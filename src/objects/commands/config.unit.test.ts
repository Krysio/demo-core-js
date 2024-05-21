import { EventEmitter } from "stream";
import { ConfigCommand } from "./config";
import { createConfig } from "@/modules/config";

const fakeNode = { events: new EventEmitter() };
const configModule = createConfig(fakeNode);

const command = new ConfigCommand(configModule);

test('To & from buffer', () => {
    const buffer1 = command.toBuffer();

    command.parse(buffer1);

    const buffer2 = command.toBuffer();
    
    expect(buffer1.isEqual(buffer2)).toBe(true);
});
