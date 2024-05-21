import { CommandAuthorData, CommandData, CommandImplementation, TYPE_ANCHOR_HASH } from '@/constants';
import WBuffer from "@/libs/WBuffer";
import { Node } from '@/main';
import Key from '@/objects/key';

export function createCommandParser(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        receiveCommand(commandBuffer: WBuffer): void {
            try {
                const command = module.parseCommand(commandBuffer);

                node.events.emit('commandParser/acceptCommand', command);
            } catch (error: unknown) {
                const command = {
                    buffer: commandBuffer,
                    isValid: false,
                    invalidMsg: (error as Error).message,
                };
                
                node.events.emit('commandParser/rejectCommand', command as CommandData);
            }
        },
        parseCommand(buffer: WBuffer): CommandData {
            const commandData: CommandData = {
                buffer,
                version: null as number,
                typeID: null as number,
                implementation: null as CommandImplementation,
                isValid: null as boolean,
                invalidMsg: null as string,
                authors: null as CommandAuthorData[],
                data: null as {[key: string]: any},
                hashableCommandPart: null as WBuffer,
                anchorHash: null as WBuffer,
                anchorIndex: null as number
            };

            module.parseCommandVersion(commandData);
            module.parseCommandType(commandData);
            module.parseCommandAnchor(commandData);
            module.parseCommandAuthors(commandData);
            module.parseCommandData(commandData);
            module.parseCommandSignatures(commandData);

            if (buffer.isCursorAtTheEnd === false) {
                throw new Error('Parser: Command is longer than expected');
            }

            return commandData;
        },
        parseCommandVersion(commandData: CommandData): void {
            const { buffer } = commandData;

            commandData.version = buffer.readUleb128();

            if (module.isValidCommandVersion(commandData.version) === false) {
                throw new Error('Parser: Invalid command version');
            }
        },
        parseCommandType(commandData: CommandData): void {
            const { buffer } = commandData;

            commandData.typeID = buffer.readUleb128();
            commandData.implementation = node.commandImplementations.get(commandData.typeID);

            if (commandData.implementation === null) {
                throw new Error('Parser: Unsupportet command type');
            }

            if (commandData.implementation.isInternalType === true) {
                throw new Error('Parser: Internal command type');
            }
        },
        parseCommandAnchor(commandData: CommandData): void {
            const { buffer } = commandData;
        
            if (commandData.implementation.anchorTypeID === TYPE_ANCHOR_HASH) {
                commandData.anchorHash = buffer.read(32);
            } else {
                commandData.anchorIndex = buffer.readUleb128();
            }
        },
        parseCommandAuthors(commandData: CommandData): void {
            const { buffer } = commandData;

            commandData.authors = [];

            if (commandData.implementation.isMultiAuthor === true) {
                commandData.authors.length = buffer.readUleb128();
            } else {
                commandData.authors.length = 1;
            }
            
            for (let i = 0; i < commandData.authors.length; i++) {
                const cursor = buffer.cursor;
                const publicKey = Key.parse(buffer);

                commandData.authors[i] = {
                    type: null,
                    signature: null,
                    userData: null,
                    publicKey,
                };
            }
        },
        parseCommandData(commandData: CommandData): void {
            const { buffer } = commandData;

            commandData.data = commandData.implementation.parse(buffer);
            commandData.hashableCommandPart = buffer.slice(0, buffer.cursor);
        },
        parseCommandSignatures(commandData: CommandData): void {
            const { buffer } = commandData;
        
            for (let author of commandData.authors) {
                author.signature = author.publicKey.parseSignature(buffer);
            }
        },
        isValidCommandVersion(version: number): boolean {
            return version === 1;
        }
    };

    node.events.on('network/receiveCommand', (commandBuffer) => {
        module.receiveCommand(commandBuffer);
    });

    return module;
}
