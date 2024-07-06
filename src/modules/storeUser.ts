import WBuffer from '@/libs/WBuffer';
import { User } from '@/objects/users';
import { Key } from '@/objects/key';

export function createStoreUser() {
    const module = {
        store: new Map<string, WBuffer>(),

        async add(user: User) {
            const key = user.publicKey.toBuffer().hex();
            const data = user.toBuffer('db');

            return module.store.set(key, data);
        },
        async get(publicKey: Key) {
            const key = publicKey.toBuffer().hex();
            const result = module.store.get(key);

            if (result) {
                const user = User.parse(result.seek(0), 'db');

                user.publicKey = publicKey;

                return user;
            }

            return null;
        }
    };

    return module;
}
