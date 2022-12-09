import { createPlugin } from '../../../shared/test';
import type { AssetpackConfig } from '../src';
import { Assetpack } from '../src';

describe('Assetpack Config', () =>
{
    it('should apply default config', async () =>
    {
        const assetpack = new Assetpack({});

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
        const baseConfig: AssetpackConfig = {
            entry: 'src/old',
            output: 'dist/old',
            ignore: ['scripts/**/*'],
            plugins: {
                test: plugin
            }
        };

        const assetpack = new Assetpack(baseConfig);

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
