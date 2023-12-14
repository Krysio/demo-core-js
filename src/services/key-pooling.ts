import WBuffer from "@/libs/WBuffer";
import KeyPoolingCommand from "@/objects/commands/key-pooling";
import Key from "@/objects/key";
import { mark, measure } from "@/performance";

const ERROR_INVALID_MESSAGE = 'Invalid user message';
const ERROR_INVALID_POOL_SIZE = 'Invalid count of keys in the pool';

export interface UserConnection {
    userID: WBuffer,
    key: Key,
    area: number,
    level: number,
    api: {
        sendUserList: (data: WBuffer) => Promise<WBuffer>,
        sendMessagePack: (data: WBuffer) => Promise<WBuffer>,
        sendCommand: (data: WBuffer) => Promise<WBuffer>
    }
}

export default class PoolingProcess {
    command: KeyPoolingCommand;
    mapOfMessages: Map<string, WBuffer[]>;

    constructor(
        public area: number,
        public listOfConnections: UserConnection[],
        public countOfInterations: number,
        public getHashOfPrevBlock: () => WBuffer
    ) {
        this.command = new KeyPoolingCommand();
        this.mapOfMessages = new Map();

        this.command.addArea(area);
        for (const connection of this.listOfConnections) {
            const keyOfMap = connection.userID.toString('hex');

            this.command.addAuthor(connection.userID);
            this.mapOfMessages.set(keyOfMap, []);
        }
    }

    createListOfUsers() {
        const list: WBuffer[] = [];

        for (let i = 0; i < this.command.listOfAuthors.length; i++) {
            const userID = this.command.listOfAuthors[i];

            list.push(
                this.command.listOfAuthors[i],
                this.listOfConnections.find(
                    (connection) => WBuffer.compare(connection.userID, userID) === 0
                ).key.toBuffer()
            );
        }

        return list;
    }

    async run() {
        await this.stage1();

        for (let i = 0; i < this.countOfInterations - 1; i++) {
            await this.stage2();
        }

        await this.stage3();
        await this.stage4();
    }

    /**
     * Sending to each user:
     * countOfInterations
     * listOfUsers: userID + publicKey
     * 
     * Receiving packages of encrypted messages addressed to ther users
     */
    async stage1() {
        mark`PoolingProcess:stage1`;

        const listOfPromises: Promise<WBuffer>[] = [];
        const userList = WBuffer.concat([
            WBuffer.uleb128(this.countOfInterations),
            WBuffer.uleb128(this.command.listOfAuthors.length),
            ...this.createListOfUsers()
        ]);

        measure`PoolingProcess:stage1`;

        for (const connection of this.listOfConnections) {
            listOfPromises.push(
                connection.api.sendUserList(userList.clone())
            );
        }

        const results = await Promise.all(listOfPromises);

        mark`PoolingProcess:consumeMessagePack`;
    
        for (const result of results) {
            this.consumeMessagePack(result);
        }

        measure`PoolingProcess:consumeMessagePack`;
    }

    /**
     * Sending addressed packages to users
     * 
     * isLastStage = false
     * Receiving packages of encrypted messages addressed to ther users
     * isLastStage = true, stage3
     * Receiving packages of publicKeys
     */
    async stage2(isLastStage = false) {
        const listOfPromises: Promise<WBuffer>[] = [];

        for (const connection of this.listOfConnections) {
            const keyOfMap = connection.userID.toString('hex');
            const listOfMessages = this.mapOfMessages.get(keyOfMap);

            listOfPromises.push(
                connection.api.sendMessagePack(WBuffer.arrayOfBufferToBuffer(listOfMessages))
            );

            listOfMessages.length = 0;
        }

        const results = await Promise.all(listOfPromises);

        if (isLastStage) {
            mark`PoolingProcess:consumeKeyPack`;

            for (const result of results) {
                this.consumeKeyPack(result);
            }

            measure`PoolingProcess:consumeKeyPack`;

            return;
        }

        mark`PoolingProcess:consumeMessagePack`;

        for (const result of results) {
            this.consumeMessagePack(result);
        }

        measure`PoolingProcess:consumeMessagePack`;
    }

    stage3() {
        return this.stage2(true);
    }

    /**
     * Sendging created command to each user
     * 
     * Receiving a signature for the command
     */
    async stage4() {
        if (this.command.listOfPublicKeys.length !== this.listOfConnections.length) {
            throw new Error(ERROR_INVALID_POOL_SIZE);
        }

        this.command.hashOfPrevBlock = this.getHashOfPrevBlock();

        const listOfPromises: Promise<[WBuffer, WBuffer]>[] = [];
        const bufferOfCommand = this.command.toBuffer('net');

        for (const connection of this.listOfConnections) {
            listOfPromises.push(
                connection.api.sendCommand(bufferOfCommand.clone()).then((data) => [data, connection.userID])
            );
        }

        const results = await Promise.all(listOfPromises);

        for (const [result, userID] of results) {
            this.consumeSignature(result, userID);
        }
    }

    consumeMessagePack(data: WBuffer) {
        if (data === null) {
            return;
        }

        const countOfMessages = data.readUleb128();

        if (countOfMessages === 0) {
            throw new Error(ERROR_INVALID_MESSAGE);
        }

        for (let i = 0; i < countOfMessages; i++) {
            const userID = data.read(32);

            if (userID.length !== 32) {
                throw new Error(ERROR_INVALID_MESSAGE);
            }

            const sizeOfMessage = data.readUleb128();

            if (sizeOfMessage === 0) {
                throw new Error(ERROR_INVALID_MESSAGE);
            }

            const message = data.read(sizeOfMessage);

            if (message.length !== sizeOfMessage) {
                throw new Error(ERROR_INVALID_MESSAGE);
            }

            const keyOfMap = userID.toString('hex');
            const listOfMessages = this.mapOfMessages.get(keyOfMap);

            if (listOfMessages === undefined) {
                console.log(keyOfMap, this.mapOfMessages);
                throw new Error(ERROR_INVALID_MESSAGE);
            }

            listOfMessages.push(message);
        }
    }

    consumeKeyPack(data: WBuffer) {
        if (data === null) {
            return;
        }

        const countOfKeys = data.readUleb128();

        for (let i = 0; i < countOfKeys; i++) {
            const isNotFake = data.readUleb128();
            const key = Key.fromBuffer(data);

            if (key.isValid() === false) {
                throw new Error(ERROR_INVALID_MESSAGE);
            }

            if (isNotFake) {
                this.command.addPublicKey(key);
            }
        }
    }

    consumeSignature(data: WBuffer, userID: WBuffer) {
        if (data === null) {
            throw new Error(ERROR_INVALID_MESSAGE);
        }

        const sizeOfSignature = data.readUleb128();

        if (sizeOfSignature === 0) {
            throw new Error(ERROR_INVALID_MESSAGE);
        }

        const signature = data.read(sizeOfSignature);

        if (signature.length !== sizeOfSignature) {
            throw new Error(ERROR_INVALID_MESSAGE);
        }

        this.command.addAuthor(userID, signature);
    }
}
