import { Block } from "@/objects/Block";
import { Frame } from "@/objects/frame";
import { Config } from "@/modules/config";
import { KeySecp256k1 } from "@/objects/key";
import { getKeyPair } from "@/libs/crypto/ec/secp256k1";
import { GenesisCommand } from "@/objects/commands";
import { ConfigCommand } from "@/objects/commands";
import { Admin } from "@/objects/users/admin";
import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_CONFIG } from "@/objects/commands/types";

export function createGenesis (initialConfig: Config, {
    manifest = '',
    countOfAdminAccount = 16
}) {
    const genesisBlock = new Block();

    const [rootPrivateKey, rootPublicKey] = getKeyPair();
    const rootKey = new KeySecp256k1(rootPublicKey);
    const listOfAdmin: Admin[] = [];
    const listOfAdminKeys: [WBuffer, WBuffer][] = [];

    for (let i = 0; i < countOfAdminAccount; i++) {
        const [adminPrivateKey, adminPublicKey] = getKeyPair();
        const adminKey = new KeySecp256k1(adminPublicKey);
        const admin = new Admin(adminKey, `"Genesis admin #${`0${i + 1}`.substring(-2)}"`);

        listOfAdmin.push(admin);
        listOfAdminKeys.push([adminPrivateKey, adminPublicKey]);
    }

    const genesisCommand = new GenesisCommand(rootKey, listOfAdmin, manifest);
    const configCommand = new ConfigCommand(initialConfig);
    const genesisFrame = new Frame(genesisCommand);
    const configFrame = new Frame(configCommand);

    genesisBlock.addCommand(genesisFrame);
    genesisBlock.addCommand(configFrame);
    genesisBlock.getMerkleRoot();

    return {
        genesisBlock, rootPrivateKey, listOfAdminKeys
    };
}

export function getConfig(genesisBlock: Block) {
    for (const command of genesisBlock.listOfCommands) {
        if (command.typeID === COMMAND_TYPE_CONFIG) {
            return (command.data as unknown as ConfigCommand).values;
        }
    }
}
