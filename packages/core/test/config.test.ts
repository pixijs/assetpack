import { createPlugin } from '../../../shared/test';
import type { AssetPackConfig } from '../src';
import { AssetPack, path } from '../src';

describe('AssetPack Config', () =>
{
    it('should apply default config', async () =>
    {
        const assetpack = new AssetPack({});

        expect(assetpack.config).toEqual({
            entry: path.join(process.cwd(), './static'),
            output: path.join(process.cwd(), './dist'),
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
            entry: path.join(process.cwd(), 'src/old'),
            output: path.join(process.cwd(), 'dist/old'),
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
