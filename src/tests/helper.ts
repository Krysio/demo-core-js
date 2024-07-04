import { Node, createNode } from '@/main';
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { Key, KeySecp256k1 } from "@/objects/key";
import { User, Admin } from "@/objects/users";
import { sha256 } from '@/libs/crypto/sha256';
import { GenesisCommand } from '@/objects/commands/genesis';
import { Block } from '@/objects/block';
import { Frame } from '@/objects/frame';
import { ConfigCommand } from '@/objects/commands/config';

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function createKey() {
    const [privateKey, publicKey] = getKeyPair();

    return new KeySecp256k1(publicKey, privateKey);
};

export function createRandomHash() {
    const [privateKey] = getKeyPair();

    return sha256(privateKey);
};

export function createAdmin({
    key = createKey(),
    parentKey = createKey()
} = {}) {
    const admin = new Admin(key);

    admin.parentPublicKey = parentKey;

    return { key, admin };
};

export function createUser({
    key = createKey(),
    parentKey = createKey(),
    timeStart = 100,
    timeEnd = 10000,
    metaData = 'meta data'
} = {}) {
    const user = new User(key);

    user.parentPublicKey = parentKey;
    user.timeStart = timeStart;
    user.timeEnd = timeEnd;
    user.metaData = metaData;

    return { key, user };
};

export function createFakeNode(override: DeepPartial<Node> = {}) {
    return Object.assign({
        events: {
            on: () => null as () => void,
            emit: () => null as () => void,
        },
    }, override) as unknown as Node;
};

export function nodeCreator({ manualTime = false } = {}) {
    const creator = {
        scope: (() => ({
            timeOfNode: 0,
            manualTime,
            manifest: 'Content of manifest',
            rootKey: null as Key,
            genesisTime: Date.now(),
            timeBetweenBlocks: 10,
            genesis: null as Block,
            listOfAdmin: [] as [Admin, Key][],
            node: null as Node,
        }))(),
        manualTime(time: number = 0) {
            creator.scope.manualTime = true;
            creator.scope.timeOfNode = time;
            creator.scope.genesisTime = time;
            creator.mockTime();

            return creator;
        },
        mockTime() {
            const { node, manualTime } = creator.scope;

            if (node) {
                if (manualTime) {
                    node.time.now = () => creator.scope.timeOfNode;
                } else {
                    node.time.now = () => Date.now();
                }
            }
        },
        addTime(time: number) {
            creator.scope.timeOfNode+= time;
        },
        manifest(value: string) {
            creator.scope.manifest = value; return creator;
        },
        genesisTime(value: number) {
            creator.scope.genesisTime = value; return creator;
        },
        blockTime(value: number) {
            creator.scope.timeBetweenBlocks = value; return creator;
        },
        rootKey(value: Key) {
            creator.scope.rootKey = value; return creator;
        },
        getAdmin() {
            return creator.scope.listOfAdmin[0][0];
        },
        get genesis(): Block {
            const { manifest, genesisTime, timeBetweenBlocks } = creator.scope;
            
            creator.scope.rootKey = creator.scope.rootKey || createKey();

            for (let i = 0; i < 4; i++) {
                const adminKey = createKey();
                const admin = new Admin(adminKey, `"Genesis admin #${`0${i + 1}`.substring(-2)}"`);
        
                creator.scope.listOfAdmin.push([admin, adminKey]);
            }

            const genesisCommand = new GenesisCommand(
                creator.scope.rootKey,
                creator.scope.listOfAdmin.map((item: [Admin, Key]) => item[0]),
                manifest
            );
            const configCommand = new ConfigCommand({
                genesisTime, timeBetweenBlocks,
                timeBeforeAccountActivation: 10,
                timeLiveOfUserAccount: 1000
            });

            creator.scope.genesis = new Block();
            creator.scope.genesis.addCommand(new Frame(genesisCommand));
            creator.scope.genesis.addCommand(new Frame(configCommand));

            return creator.scope.genesis;
        },
        get node(): Node {
            if (!creator.scope.node) {
                creator.scope.node = createNode({
                    genesisBlock: creator.genesis
                });
                creator.mockTime();
            }

            return creator.scope.node;
        },
        stopNode() {
            if (creator.scope.node) {
                creator.scope.node.stop();
            }
        },
    };

    return creator;
}