import Time from '@/libs/Time';
import WBuffer from '@/libs/WBuffer';
import { Node } from '@/main';
import * as fs from 'fs/promises';
import * as path from 'path';

const DIR_RUN = path.join('run');

export function createFs(refToNode: unknown) {
    const node = refToNode as Node;
    const module = {
        mainDir: DIR_RUN,
        blockDir: DIR_RUN,
        async createRunFolder() {
            try {
                await fs.lstat(DIR_RUN);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    await fs.mkdir(DIR_RUN);
                }
            }

            const name = Time.timeToSQL(node.config.genesisTime).replaceAll(':', '-');

            module.mainDir = path.join(DIR_RUN, name);
            module.blockDir = path.join(DIR_RUN, name, 'blocks');

            try {
                await fs.lstat(module.mainDir);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    await fs.mkdir(module.mainDir);
                    await fs.mkdir(module.blockDir);
                }
            }

            node.events.emit('init/fs');
        },
        saveBlock(blockName: string, data: WBuffer) {
            const filePath = path.join(module.blockDir, blockName);

            fs.writeFile(filePath, data);
        }
    };

    node.events.on('init/config', () => {
        module.createRunFolder();
    });

    return module;
}
