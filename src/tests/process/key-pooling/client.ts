import WBuffer, { EMPTY_BUFFER } from "@/libs/WBuffer";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { Command } from "@/objects/commands/command";
import KeyPoolingCommand from "@/objects/commands/key-pooling";
import Key, { KeySecp256k1 } from "@/objects/key";
import { mark, measure } from "@/performance";

export default class Client {
    newPrivateKey: WBuffer;
    newPublicKey: WBuffer;
    mapOfUsers: Map<string, Key>;
    newKey: KeySecp256k1;

    constructor(
        public userID: WBuffer,
        public key: Key,
        public area: number
    ) {
        this.mapOfUsers = new Map();

        const [ newPrivateKey, newPublicKey ] = getKeyPair();
    
        this.newPrivateKey = newPrivateKey;
        this.newPublicKey = newPublicKey;
        this.newKey = new KeySecp256k1(newPublicKey);
    }

    //#region communication

    getApi() {
        return {
            sendUserList: (data: WBuffer) => {
                return this.consumeUserList(data);
            },
            sendMessagePack: (data: WBuffer) => {
                return this.consumeMessagePack(data);
            },
            sendCommand: (data: WBuffer) => {
                return this.consumeCommand(data);
            }
        };
    }

    //#endregion communication
    //#region state
    
    //#endregion state
    //#region consume messages

    async consumeUserList(data: WBuffer): Promise<WBuffer> {
        mark`consumeUserList`;

        const countOfInterations = data.readUleb128();
        const countOfUsers = data.readUleb128();

        for (let i = 0; i < countOfUsers; i++) {
            const userID = data.read(16);
            const key = Key.fromBuffer(data);

            if (WBuffer.isEqual(userID, this.userID)) {
                continue;
            }

            const keyOfMap = userID.toString('hex');
            this.mapOfUsers.set(keyOfMap, key);
        }

        const isFake = WBuffer.hex`00`;
        const isNotFake = WBuffer.hex`01`;
        const listOfKeys: WBuffer[] = [];

        for (let i = 0; i < countOfUsers - 2; i++) {
            const [, publicKey] = getKeyPair();
            const key = new KeySecp256k1(publicKey);

            listOfKeys.push(
                WBuffer.concat([isFake, key.toBuffer()])
            );
        }

        // insert the new key at random index
        listOfKeys.splice(
            Math.floor(Math.random() * 1000) % listOfKeys.length,
            0,
            WBuffer.concat([isNotFake, this.newKey.toBuffer()])
        );

        for (let i = 0; i < listOfKeys.length; i++) {
            let data = listOfKeys[i];
            let prevUserID: string = null;

            for (let j = 0; j < countOfInterations; j++) {
                let userID;
                
                // get userID !== prevUserID
                do {
                    userID = [...this.mapOfUsers.keys()][Math.floor(Math.random() * 1000) % this.mapOfUsers.size];
                } while (prevUserID === userID);

                const key = this.mapOfUsers.get(userID);
                const encryptedData = key.encrypt(data);

                data = WBuffer.concat([
                    WBuffer.from(userID, 'hex'),
                    WBuffer.uleb128(encryptedData.length),
                    encryptedData
                ]);

                prevUserID = userID;
            }

            listOfKeys[i] = data;
        }

        const response = WBuffer.concat([
            WBuffer.uleb128(listOfKeys.length),
            ...listOfKeys
        ]);

        measure`consumeUserList`;

        return response;
    }

    async consumeMessagePack(data: WBuffer) : Promise<WBuffer> {
        mark`consumeMessagePack`;

        const countOfMessages = data.readUleb128();
        const listOfDecryptedMessages: WBuffer[] = [];
        
        for (let i = 0; i < countOfMessages; i++) {
            const sizeOfMessage = data.readUleb128();
            const message = data.read(sizeOfMessage);

            listOfDecryptedMessages.push(
                this.key.decrypt(message)
            );
        }

        const countOfDecryptedMessages = listOfDecryptedMessages.length; 
        const response = WBuffer.concat([
            WBuffer.uleb128(countOfDecryptedMessages),
            ...listOfDecryptedMessages
        ]);

        measure`consumeMessagePack`;

        return response;
    }

    async consumeCommand(data: WBuffer): Promise<WBuffer> {
        mark`consumeCommand`;

        const command = Command.fromBuffer(data, 'net');

        if (command instanceof KeyPoolingCommand) {
            let isValidListOfAreas = false;
            let isNewKeyIncluded = false;

            // check is valid list of area
            for (const area of command.listOfAreas) {
                if (area === this.area) {
                    isValidListOfAreas = true;
                    break;
                }
            }
            
            // find my new key in the pool
            for (const key of command.listOfPublicKeys) {
                if (key.isEqual(this.newKey)) {
                    isNewKeyIncluded = true;
                    break;
                }
            }

            if (isValidListOfAreas === false) return EMPTY_BUFFER;
            if (isNewKeyIncluded === false) return EMPTY_BUFFER;
        } else {
            return EMPTY_BUFFER;
        }

        try {
            const hash = command.getHash();
            const signature = this.key.sign(hash);
            const response = WBuffer.concat([
                WBuffer.uleb128(signature.length),
                signature
            ]);

            return response;
        } catch (error) {
            console.log(this.key.privateKey);
            console.log(this.key);
            throw error;
        } finally {
            measure`consumeCommand`;
        }
    }

    //#endregion consume messages
}
