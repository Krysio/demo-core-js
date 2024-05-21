import WBuffer from "@/libs/WBuffer";
import { Node } from '@/main';
import { createCommandParser } from "./commandParser";
import { EventEmitter } from "node:stream";
import { CommandData, CommandImplementation, TYPE_ANCHOR_HASH } from "@/constants";
import { EMPTY_HASH, sha256 } from "@/libs/crypto/sha256";
import { TYPE_USER_VOTER } from "@/objects/user";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { KeySecp256k1 } from "@/objects/key/secp256k1";

describe('Testing parser', () => {
    const testTypeImplementation: CommandImplementation = {
        isInternalType: false,
        isMultiAuthor: false,
        isNeedAutorize: false,
        parse: (buffer: WBuffer) => {
            const sizeOfData = buffer.readUleb128();

            return { foo: buffer.read(sizeOfData) };
        },
        anchorTypeID: TYPE_ANCHOR_HASH,
        userTypeID: TYPE_USER_VOTER
    };
    const fakeNode = {
        events: new EventEmitter() as Node['events'],
        commandImplementations: {
            get: () => testTypeImplementation
        }
    };
    const testedModule = createCommandParser(fakeNode);

    describe('Positive scenario', () => {
        const hash = EMPTY_HASH.hex();
        const [privateKey, publicKey] = getKeyPair();
        const key = new KeySecp256k1(publicKey, privateKey);
        const command = WBuffer.hex
        // version type anchor  author'sPublicKey data
        `  01      00   ${hash} ${key}            01 99`;
        const signature = key.sign(sha256(command));
        const signedCommand = WBuffer.concat([command, signature]);
        let parsingResult: CommandData;
    
        test('Parsing', () => {
            parsingResult = testedModule.parseCommand(signedCommand);
    
            expect(parsingResult.invalidMsg).toBe(null);
            expect(parsingResult.version).toBe(1);
            expect(parsingResult.typeID).toBe(0);
    
            expect(parsingResult.anchorHash.hex()).toBe(hash);
    
            expect(parsingResult.authors.length).toBe(1);
            expect(parsingResult.authors[0].publicKey.isEqual(key)).toBe(true);
            expect(parsingResult.authors[0].signature.isEqual(signature)).toBe(true);
    
            expect(parsingResult.data.foo.isEqual(WBuffer.hex`99`)).toBe(true);
            expect(parsingResult.hashableCommandPart.isEqual(command)).toBe(true);
        });

        test('Full flow through the module', () => {
            const fn = jest.fn();
    
            fakeNode.events.on('commandParser/acceptCommand', fn);
            fakeNode.events.emit('network/receiveCommand', signedCommand.seek(0));
    
            expect(fn).toBeCalledWith(parsingResult);
        });
    });
});
