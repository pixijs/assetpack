import { describe, expect, it } from 'vitest';
import { Asset } from '../../src/core/Asset.js';
import { PipeSystem } from '../../src/core/pipes/PipeSystem.js';

import type { AssetPipe } from '../../src/core/pipes/AssetPipe.js';

describe('PipeSystem', () => {
    it('should transform an asset', async () => {
        const asset = new Asset({
            path: 'test.png',
            isFolder: false,
        });

        const dummyPipe: AssetPipe = {
            name: 'dummy',
            defaultOptions: {},
            transform: async (_asset: Asset) => {
                const newAsset = new Asset({
                    path: 'test@2x.png',
                });

                const newAsset2 = new Asset({
                    path: 'test@1x.png',
                });

                return [newAsset, newAsset2];
            },
            test: (_asset: Asset) => true,
        };

        const pipeSystem = new PipeSystem({
            entryPath: 'in',
            outputPath: 'out',
            pipes: [dummyPipe],
        });

        await pipeSystem.transform(asset);

        expect(asset.transformChildren.length).toBe(2);
    });
});
