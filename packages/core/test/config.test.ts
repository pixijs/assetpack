import { createAssetPipe } from '../../../shared/test';
import { AssetPack } from '../src';
import type { AssetPackConfig } from '../src/config';

describe('AssetPack Config', () =>
{
    it('should apply default config', async () =>
    {
        const assetpack = new AssetPack({});

        expect(assetpack.config).toEqual({
            entry: './static',
            output: './dist',
            ignore: [],
            cache: true,
            logLevel: 'info',
            pipes: [],
        });
    });

    it('should merge configs correctly', async () =>
    {
        const plugin = createAssetPipe({ test: true });
        const baseConfig: AssetPackConfig = {
            entry: 'src/old',
            output: 'dist/old',
            ignore: ['scripts/**/*'],
            pipes: [
                plugin
            ]
        };

        const assetpack = new AssetPack(baseConfig);

        expect(assetpack.config).toEqual({
            entry: 'src/old',
            output:  'dist/old',
            ignore: ['scripts/**/*'],
            cache: true,
            logLevel: 'info',
            pipes: [
                plugin
            ],
        });
    });
});
