import { Asset } from '../src/Asset';
import { PipeSystem } from '../src/pipes/PipeSystem';

import type { AssetPipe } from '../src/pipes/AssetPipe';

describe('PipeSystem', () =>
{
    it('should transform an asset', async () =>
    {
        const asset = new Asset({
            path: 'test.png',
            isFolder: false,
        });

        const dummyPipe: AssetPipe = {
            name: 'dummy',
            defaultOptions: {},
            transform: async (_asset: Asset) =>
            {
                const newAsset = new Asset({
                    path: 'test@2x.png',
                });

                const newAsset2 = new Asset({
                    path: 'test@1x.png',
                });

                return [newAsset, newAsset2];
            },
            test: (_asset: Asset) =>
                true
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
