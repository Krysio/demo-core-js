import WBuffer from "@/libs/WBuffer";
import { COMMAND_TYPE_GENESIS } from "./types";
import { Type, CommandTypeInternal, ICommandImplementation } from "./command";
import Key from "../key";
import User from "../user";
import { Node } from '@/main';

@Type(COMMAND_TYPE_GENESIS)
export default class GenesisCommand extends CommandTypeInternal implements ICommandImplementation {
    constructor(
        public rootPublicKey: Key,
        public listOfAdminAccounts: User[] = [],
        public manifest: string = '',
    ) { super(); }

    fromBufferImplementation(buffer: WBuffer): void {
        const sizeOfManifest = buffer.readUleb128();

        this.manifest = buffer.read(sizeOfManifest).utf8();
        this.rootPublicKey = Key.fromBuffer(buffer);

        const countOfAdminAccounts = buffer.readUleb128();

        for (let i = 0; i < countOfAdminAccounts; i++) {
            this.listOfAdminAccounts.push(
                User.fromBuffer(buffer) 
            );
        }
    }

    toBufferImplementation(): WBuffer {
        const manifest = WBuffer.from(this.manifest, 'utf8');
        const sizeOfManifest = WBuffer.uleb128(manifest.length);
        const rootPublicKey = this.rootPublicKey.toBuffer();
        const countOfAdminAccounts = WBuffer.uleb128(this.listOfAdminAccounts.length);
        const listOfAdminAccounts = this.listOfAdminAccounts.map((account) => account.toBuffer());

        return WBuffer.concat([
            sizeOfManifest,
            manifest,
            rootPublicKey,
            countOfAdminAccounts,
            ...listOfAdminAccounts
        ]);
    }

    isValidImplementation(node: Node): boolean {
        if (node.chainTop.getHeight() !== 0) {
            return false;
        }

        if (!this.rootPublicKey || !this.rootPublicKey.isValid()) {
            return false;
        }
        

        for (const adminUser of this.listOfAdminAccounts) {
            if (!adminUser.isValid()) {
                return false;
            }
        }

        return true;
    }

    async verifyImplementation(node: Node): Promise<boolean> {
        if (node.chainTop.getHeight() !== 0) {
            return false;
        }

        return true;
    }

    async getEffectsImplementation(node: Node): Promise<void> {}
};
