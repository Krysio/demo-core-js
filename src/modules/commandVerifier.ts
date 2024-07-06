import { Node } from '@/main';
import { Frame } from "@/objects/frame";

export function createCommandVerifier(refToNode: unknown) {
    const node = refToNode as Node;

    const module = {
        async verify(frame: Frame) {
            try {
                module.verifyAnchor(frame);
                module.verifySignatures(frame);
                await frame.data.verify(node, frame);

                node.events.emit('commandVerifier/acceptCommand', frame);
            } catch (error) {
                frame.isValid = false;
                frame.invalidMsg = (error as Error).message;
                
                node.events.emit('commandVerifier/rejectCommand', frame);
            }
        },
        // eslint-disable-next-line
        verifyAnchor(frame: Frame) {
            // TODO 
            // Sprawdzamy czy kotwica jest prawidłowego typu
            // Sprawdzamy czy kotwica odwołuje się do istniejącego miejsca
        },
        verifySignatures(frame: Frame) {
            const hash = frame.getHash();

            for (let i = 0; i < frame.authors.length; i++) {
                const { publicKey, signature } = frame.authors[i];
                const result = publicKey.verify(hash, signature);

                if (result === false) {
                    throw new Error(`Signature of ${i+1}'th user is invalid`);
                }
            }
        }
    };

    node.events.on('commandParser/acceptCommand', (commandData) => {
        module.verify(commandData);
    });

    return module;
}
