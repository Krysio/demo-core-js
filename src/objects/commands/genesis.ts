import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_GENESIS } from "./types";
import { Type, ICommand, TYPE_ANCHOR_INDEX, TYPE_VALUE_PRIMARY } from "@/objects/commands";
import { Key } from "@/objects/key";
import { Admin } from "@/objects/users/admin";
import { Node } from '@/main';

@Type(COMMAND_TYPE_GENESIS)
export class GenesisCommand implements ICommand {
    //#region cmd config

    anchorTypeID = TYPE_ANCHOR_INDEX;
    isInternal = true;
    isMultiAuthor = false;
    isValueHasKey = false;
    valueTypeID = TYPE_VALUE_PRIMARY;

    //#enregion cmd config

    constructor(
        public rootPublicKey: Key = null,
        public listOfAdminAccounts: Admin[] = [],
        public manifest: string = '',
    ) {}

    //#region buffer

    public parse(buffer: WBuffer) {
        const sizeOfManifest = buffer.readUleb128();

        this.manifest = buffer.read(sizeOfManifest).utf8();
        this.rootPublicKey = Key.parse(buffer);

        const countOfAdminAccounts = buffer.readUleb128();

        for (let i = 0; i < countOfAdminAccounts; i++) {
            this.listOfAdminAccounts.push(
                Admin.parse(buffer) 
            );
        }

        return this;
    }

    public toBuffer(): WBuffer {
        const rootPublicKey = this.rootPublicKey.toBuffer();
        const countOfAdminAccounts = WBuffer.uleb128(this.listOfAdminAccounts.length);
        const listOfAdminAccounts = this.listOfAdminAccounts.map((account) => account.toBuffer());

        return WBuffer.concat([
            this.toBufferManifest(),
            rootPublicKey,
            countOfAdminAccounts,
            ...listOfAdminAccounts
        ]);
    }

    public toBufferManifest() {
        if (this.manifest.length === 0) {
            return WBuffer.uleb128(0);
        }

        const manifest = WBuffer.from(this.manifest, 'utf8');
        const sizeOfManifest = WBuffer.uleb128(manifest.length);

        return WBuffer.concat([
            sizeOfManifest,
            manifest
        ]);
    }

    //#enregion buffer

    public async verify(node: Node): Promise<void> {
        if (node.chainTop.getHeight() !== 0) {
            throw new Error(`${GenesisCommand.name}: Invalid height of blockChain`);
        }
    }
};
