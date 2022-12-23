import type { MockPlugin } from '../../../shared/test/index';
import { createFolder, createPlugin, getInputDir, getOutputDir } from '../../../shared/test/index';
import { AssetPack } from '../src/AssetPack';
import type { Plugin } from '../src/Plugin';

const pkg = 'core';

describe('Core', () =>
{
    it('should fail gracefully if json is malformed', async () =>
    {
        expect(true).toBe(true);
    });

    it('should add plugins', () =>
    {
        //
    });

    it('should run plugin function in order', async () =>
    {
        const testName = 'plugin-order';
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
            transform: true,
        }) as MockPlugin;

        const plugin2: MockPlugin = createPlugin({
            folder: false,
            test: true,
            start: true,
            finish: true,
            post: true,
        }) as MockPlugin;

        let assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                json: plugin as Plugin<any>,
            }
        });

        await assetpack.run();

        expect(plugin.start.mock.invocationCallOrder[0]).toBeLessThan(plugin.test.mock.invocationCallOrder[0]);
        expect(plugin.test.mock.invocationCallOrder[0]).toBeLessThan(plugin.transform.mock.invocationCallOrder[0]);
        expect(plugin.transform.mock.invocationCallOrder[0]).toBeLessThan(plugin.finish.mock.invocationCallOrder[0]);

        assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                json: plugin2 as Plugin<any>,
            }
        });

        await assetpack.run();

        expect(plugin2.start.mock.invocationCallOrder[0]).toBeLessThan(plugin2.test.mock.invocationCallOrder[0]);
        expect(plugin2.test.mock.invocationCallOrder[0]).toBeLessThan(plugin2.post.mock.invocationCallOrder[0]);
        expect(plugin2.post.mock.invocationCallOrder[0]).toBeLessThan(plugin2.finish.mock.invocationCallOrder[0]);
    });

    it('should provide the correct options overrides to the plugin', () =>
    {
        //
    });

    it('should not copy to output if transformed', () =>
    {
        //
    });

    it('should ignore specified files in config', () =>
    {
        //
    });

    it('should add tags from file config overrides', () =>
    {
        //
    });

    it('should add ignore tags from file config overrides and not process these files', () =>
    {
        //
    });
});
