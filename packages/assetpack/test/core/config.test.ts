import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { createAssetPipe } from '../utils/index.js';

import type { AssetPackConfig } from '../../src/core/config.js';

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
            cacheLocation: '.assetpack',
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
            cacheLocation: '.assetpack',
            logLevel: 'info',
            pipes: [
                plugin
            ],
        });
    });
});
