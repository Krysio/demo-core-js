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
            const frame = module.parseCommand(buffer);

            if (frame.isValid === true) {
                node.events.emit('commandParser/acceptCommand', frame);
            } else {
                node.events.emit('commandParser/rejectCommand', frame);
            }
        },
        parseCommand(buffer: WBuffer, frame = new Frame()) {
            try {
                frame.parse(buffer);
                frame.isValid = true;
            } catch (error) {
                frame.isValid = false;
                frame.invalidMsg = (error as Error).message;
            }

            return frame;
        }
    };

    node.events.on('network/receiveCommand', (commandBuffer) => {
        module.receiveCommand(commandBuffer);
    });

    return module;
}
