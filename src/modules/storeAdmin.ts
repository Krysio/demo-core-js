import WBuffer from '@/libs/WBuffer';
import { Node } from '@/main';
import { GenesisCommand } from '@/objects/commands/genesis';
import { COMMAND_TYPE_GENESIS } from '@/objects/commands/types';
import { Admin } from '@/objects/users';
import { Key } from '@/objects/key';

export function createStoreAdmin(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        store: new Map<string, WBuffer>(),

        async add(admin: Admin) {
            const key = admin.publicKey.toBuffer().hex();
            const data = admin.toBuffer('db');

            return module.store.set(key, data);
        },
        async get(publicKey: Key) {
            const key = publicKey.toBuffer().hex();
            const result = module.store.get(key);

            if (result) {
                const admin = Admin.parse(result.seek(0), 'db');

                admin.publicKey = publicKey;

                return admin;
            }

            return null;
        }
    };

    node.events.on('init/genesis', (genesisBlock) => {
        for (const command of genesisBlock.listOfCommands) {
            if (command.typeID === COMMAND_TYPE_GENESIS) {
                const { rootPublicKey, listOfAdminAccounts } = (command.data as GenesisCommand);

                for (const adminAccount of listOfAdminAccounts) {
                    adminAccount.parentPublicKey = rootPublicKey;
                    module.add(adminAccount);
                }
            }
        }
    });

    return module;
}
