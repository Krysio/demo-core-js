import { CommandData } from '@/constants';
import { Node } from '@/main';
import User from '@/objects/user';

export function createCommandAutorizer(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        listOfCommandsToAutorize: [] as CommandData[],
        /**
         * Get data SB of user data
         */
        async fillUserData(commandData: CommandData) {
            // TODO
            // W zależjności od typu komendy szukamy w danych w odpowiedniej bazie
            
            for (let author of commandData.authors) {
                const userData = await node.storeUser.get(author.publicKey.buffer);

                if (userData) {
                    author.userData = User.fromBuffer(userData);
                }

                if (author.userData === null) {
                    throw new Error('CommandAutorizer: command has been not autorized, not active');
                }
            }
        },
        async autorize(commandData: CommandData) {
            try {
                if (commandData.implementation.isNeedAutorize === true) {
                    await module.fillUserData(commandData);

                    // TODO
                    // Czy ma uprawnienia do wykonania takiej komendy
                }

                node.events.emit('commandAutorizer/acceptCommand', commandData);
            } catch (error: unknown) {
                commandData.isValid = false;
                commandData.invalidMsg = (error as Error).message;
                
                node.events.emit('commandAutorizer/rejectCommand', commandData);
            }
        }
    };

    node.events.on('commandVerifier/acceptCommand', (commandData) => {
        module.autorize(commandData);
    });

    return module;
}
