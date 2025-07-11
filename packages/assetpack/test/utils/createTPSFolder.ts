import { assetPath, createFolder } from './index.js';

import type { File } from './index.js';

export function createTPSFolder(testName: string, pkg: string): void {
    const sprites: File[] = [];

    for (let i = 0; i < 10; i++) {
        sprites.push({
            name: `sprite${i}.png`,
            content: assetPath(`image/sp-${i + 1}.png`),
        });
    }
    createFolder(pkg, {
        name: testName,
        files: [],
        folders: [
            {
                name: 'sprites{tps}',
                files: sprites,
                folders: [],
            },
        ],
    });
}
