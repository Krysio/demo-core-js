import { CommandData } from '@/constants';
import { Node } from '@/main';
import { sha256 } from '@/libs/crypto/sha256';

export function createCommandVerifier(refToNode: unknown) {
    const node = refToNode as Node;

    const module = {
        verify(commandData: CommandData) {
            try {
                node.events.emit('commandVerifier/acceptCommand', commandData);
            } catch (error: unknown) {
                commandData.isValid = false;
                commandData.invalidMsg = (error as Error).message;
                
                node.events.emit('commandVerifier/rejectCommand', commandData);
            }
        },
        verifyAnchor(commandData: CommandData) {
            // TODO 
            // Sprawdzamy czy kotwica jest prawidłowego typu
            // Sprawdzamy czy kotwica odwołuje się do istniejącego miejsca
        },
        verifySignatures(command: CommandData): CommandData {
            const hash = sha256(command.hashableCommandPart);

            for (let i = 0; i < command.authors.length; i++) {
                const { publicKey, signature } = command.authors[i];
                const result = publicKey.verify(hash, signature);

                if (result === false) {
                    throw new Error(`Signature of ${i+1}'th user is invalid`);
                }
            }

            return command;
        }
    };

    node.events.on('commandParser/acceptCommand', (commandData) => {
        module.verify(commandData);
    });

    return module;
}
