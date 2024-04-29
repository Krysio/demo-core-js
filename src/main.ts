import * as fs from "node:fs/promises";
import chainTop from "./ChainTop";
import config, { Config, initialConfig } from "./config";
import { getKeyPair } from "./libs/crypto/ec/secp256k1";
import { EMPTY_HASH, sha256File } from "./libs/crypto/sha256";
import Block from "@/objects/Block";
import ConfigCommand from "@/objects/commands/config";
import DBSnapshotCommand from "@/objects/commands/db-snapshots";
import GenesisCommand from "@/objects/commands/genesis";
import { KeySecp256k1 } from "@/objects/key";
import db, { createDb, dbReady } from "@/storage/db";
import WBuffer from "./libs/WBuffer";

const pathToUsersDB = './db/users.db';

const main = new class Main {
    state: 'none' = 'none';

    loadConfig(newConfig: Config) {
        Object.assign(config, newConfig);
    }

    loadGenesis(buffer: WBuffer) {

    }

    async start() {
        if (chainTop.getHeight()) {

        }

        await this.generateGenesisBlock();
    }

    async generateGenesisBlock() {
        await fs.rm(pathToUsersDB);

        createDb();
        await dbReady;

        const block = new Block();
        const [rootPrivateKey, rootPublicKey] = getKeyPair();
        const rootKey = new KeySecp256k1(rootPublicKey);

        block.hashOfPrevBlock = EMPTY_HASH;

        const genesisCommand = new GenesisCommand(rootKey);
        const configCommand = new ConfigCommand(config);
        const dbSnapshotCommand = await this.generateDBSnapshotCommand();

        block.addCommand(genesisCommand);
        block.addCommand(configCommand);
        block.addCommand(dbSnapshotCommand);

        await block.apply();
    }

    async generateDBSnapshotCommand() {
        const dbSnapshotCommand = new DBSnapshotCommand(EMPTY_HASH);

        await fs.copyFile(pathToUsersDB, `${pathToUsersDB}.snapshot`)
        
        const hashOfUserDB = await sha256File(`${pathToUsersDB}.snapshot`);

        dbSnapshotCommand.hashOfUsersDB = hashOfUserDB;

        return dbSnapshotCommand;
    }
};

export default main;
