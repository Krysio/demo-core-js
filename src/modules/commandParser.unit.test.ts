import { EventEmitter } from "node:stream";
import WBuffer from "@/libs/WBuffer";
import { EMPTY_HASH, sha256 } from "@/libs/crypto/sha256";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { Node } from '@/main';
import { Frame } from "@/objects/frame";
import { ICommand, Type, TYPE_ANCHOR_HASH } from "@/objects/commands";
import { KeySecp256k1 } from "@/objects/key";
import { createCommandParser } from "./commandParser";

describe('Testing parser', () => {
    @Type(0) class TestCommand implements ICommand {
        isInternal = false;
        isMultiAuthor = false;
        anchorTypeID = TYPE_ANCHOR_HASH;
        value = 0;

        public foo: WBuffer = null;
    
        public parse(buffer: WBuffer) {
            const sizeOfData = buffer.readUleb128();

            this.foo = buffer.read(sizeOfData);

            return this;
        }
        public toBuffer() { return null as WBuffer; }
        public async verify(node: Node, frame: Frame) {};
    };
    const fakeNode = {
        events: new EventEmitter() as Node['events']
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
        let parsingResult: Frame;
    
        test('Parsing', () => {
            parsingResult = testedModule.parseCommand(signedCommand);
    
            expect(parsingResult.invalidMsg).toBe(null);
            expect(parsingResult.version).toBe(1);
            expect(parsingResult.data.typeID).toBe(0);
    
            expect(parsingResult.anchorHash.hex()).toBe(hash);
    
            expect(parsingResult.authors.length).toBe(1);
            expect(parsingResult.authors[0].publicKey.isEqual(key)).toBe(true);
            expect(parsingResult.authors[0].signature.isEqual(signature)).toBe(true);
    
            expect(parsingResult.data).toBeInstanceOf(TestCommand);
            expect((parsingResult.data as any).foo.isEqual(WBuffer.hex`99`)).toBe(true);
            expect(parsingResult.bufferForHash.isEqual(command)).toBe(true);
        });

        test('Full flow through the module', () => {
            const fn = jest.fn();
    
            fakeNode.events.on('commandParser/acceptCommand', fn);
            fakeNode.events.emit('network/receiveCommand', signedCommand.seek(0));

            expect(fn).toBeCalledWith(parsingResult);
        });
    });
});
