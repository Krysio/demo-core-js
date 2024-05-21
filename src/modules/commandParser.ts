import WBuffer from "@/libs/WBuffer";
import { Node } from "@/main";
import { Frame } from "@/objects/frame";

export function isValidCommandVersion(version: number): boolean {
    return version === 1;
};

export function createCommandParser(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        receiveCommand(buffer: WBuffer): void {
            const frame = new Frame();

            try {
                module.parseCommand(buffer, frame);

                node.events.emit('commandParser/acceptCommand', frame);
            } catch (error: unknown) {
                frame.isValid = false;
                frame.invalidMsg = (error as Error).message;
                
                node.events.emit('commandParser/rejectCommand', frame);
            }
        },
        parseCommand(buffer: WBuffer, frame = new Frame()) {
            return frame.parse(buffer);
        }
    };

    node.events.on('network/receiveCommand', (commandBuffer) => {
        module.receiveCommand(commandBuffer);
    });

    return module;
}
