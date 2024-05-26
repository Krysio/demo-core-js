import WBuffer from '@/libs/WBuffer';
import { Node } from '@/main';
import { GenesisCommand } from '@/objects/commands';
import { COMMAND_TYPE_GENESIS } from '@/objects/commands/types';

export function createStoreAdmin(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        store: new Map<string, WBuffer>(),

        async add(key: WBuffer, data: WBuffer) {
            return module.store.set(key.hex(), data);
        },
        async get(publicKey: WBuffer) {
            return module.store.get(publicKey.hex()) || null;
        }
    };

    node.events.on('init/genesis', (genesisBlock) => {
        for (const command of genesisBlock.listOfCommands) {
            if (command.typeID === COMMAND_TYPE_GENESIS) {
                const { listOfAdminAccounts } = (command.data as unknown as GenesisCommand);

                for (const adminAccount of listOfAdminAccounts) {
                    const key = adminAccount.publicKey.toBuffer();
                    const data = adminAccount.toBuffer();

                    module.add(key, data);
                }
            }
        }
    });

    return module;
}
