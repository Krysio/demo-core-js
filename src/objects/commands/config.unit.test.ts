import { createFakeNode } from "@/tests/helper";
import { createConfig } from "@/modules/config";
import { ConfigCommand } from "./config";

test('To & from buffer should result the same data', () => {
    //#region Given
    const fakeNode = createFakeNode();
    const configModule = createConfig(fakeNode);
    const command = new ConfigCommand(configModule);
    //#enregion Given

    //#region When
    const buffer1 = command.toBuffer();
    const buffer2 = new ConfigCommand().parse(buffer1).toBuffer();
    //#enregion When

    //#region Then
    expect(buffer1.isEqual(buffer2)).toBe(true);
    //#enregion Then
});
