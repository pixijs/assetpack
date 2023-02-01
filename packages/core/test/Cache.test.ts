import type { MockPlugin } from '../../../shared/test';
import { createFolder, createPlugin, getInputDir, getOutputDir } from '../../../shared/test';
import { AssetPack } from '../src/AssetPack';
import { SavableAssetCache } from '../src/Cache';
import type { Plugin } from '../src/Plugin';

const pkg = 'core';

describe('Cache', () =>
{
    it('should gather all transformed files', async () =>
    {
        const testName = 'cache';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'anything',
                        files: [],
                        folders: [],
                    },
                ],
            });

        const plugin = createPlugin({
            folder: false,
            test: true,
            start: true,
            finish: true,
            transform: async (tree) =>
            {
                SavableAssetCache.set('test', { tree, transformData: { path: 'test', files: [], type: 'test' } });
            },
        }) as MockPlugin;

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                json: plugin as Plugin<any>,
            }
        });

        await assetpack.run();

        expect(SavableAssetCache['cache'].size).toBe(1);
        expect(SavableAssetCache.get('test')).toBeDefined();
    });
});
