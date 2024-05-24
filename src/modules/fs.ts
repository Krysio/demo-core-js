
import Time from '@/libs/Time';
import { Node } from '@/main';
import { Block } from '@/objects/Block';
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
        getBlockPath(block: Block) {
            return `${`0000000${block.index}`.substring(-8)}-${block.getHash().hex()}.bin`;
        },
        saveBlock(block: Block) {
            fs.writeFile(
                path.join(module.blockDir, module.getBlockPath(block)),
                block.toBuffer('full')
            );
        }
    };

    node.events.on('init/config', () => {
        module.createRunFolder();
    });

    return module;
}
