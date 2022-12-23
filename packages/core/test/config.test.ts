import { createPlugin } from '../../../shared/test';
import type { AssetPackConfig } from '../src';
import { AssetPack } from '../src';

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
            plugins: {},
            files: []
        });
    });

    it('should merge configs correctly', async () =>
    {
        const plugin = createPlugin({ test: true });
        const baseConfig: AssetPackConfig = {
            entry: 'src/old',
            output: 'dist/old',
            ignore: ['scripts/**/*'],
            plugins: {
                test: plugin
            }
        };

        const assetpack = new AssetPack(baseConfig);

        expect(assetpack.config).toEqual({
            entry: 'src/old',
            output: 'dist/old',
            ignore: ['scripts/**/*'],
            cache: true,
            logLevel: 'info',
            plugins: {
                test: plugin
            },
            files: []
        });
    });
});
