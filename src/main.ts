import * as fs from "node:fs/promises";
import chainTop from "./chaintop";
import config from "./config";
import { getKeyPair } from "./libs/crypto/ec/secp256k1";
import { EMPTY_HASH, sha256File } from "./libs/crypto/sha256";
import Block from "@/objects/block";
import ConfigCommand from "@/objects/commands/config";
import DBSnapshotCommand from "@/objects/commands/db-snapshots";
import GenesisCommand from "@/objects/commands/genesis";
import { KeySecp256k1 } from "@/objects/key";
import { createDb, dbReady } from "@/storage/db";

const pathToUsersDB = './db/users.db';

const main = new class Main {
    async start() {
        if (chainTop.getHeight() === 0) {
            await this.generateGenesisBlock();
        }
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
