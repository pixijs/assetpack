import { existsSync, removeSync, writeJSONSync } from 'fs-extra';
import { join } from 'path';
import type { MockPlugin } from '../../../shared/test/index';
import { assetPath, createFolder, createPlugin, getInputDir, getOutputDir } from '../../../shared/test/index';
import { AssetPack } from '../src/AssetPack';
import type { Plugin } from '../src/Plugin';

const pkg = 'core';

describe('Core', () =>
{
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

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                json: plugin as Plugin<any>,
            },
            cache: false,
        });

        await assetpack.run();

        expect(plugin.start.mock.invocationCallOrder[0]).toBeLessThan(plugin.test.mock.invocationCallOrder[0]);
        expect(plugin.test.mock.invocationCallOrder[0]).toBeLessThan(plugin.transform.mock.invocationCallOrder[0]);
        expect(plugin.transform.mock.invocationCallOrder[0]).toBeLessThan(plugin.finish.mock.invocationCallOrder[0]);
    });

    it('should watch for changes', async () =>
    {
        const testName = 'watch-delete';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [{
                    name: 'json.json',
                    content: assetPath(pkg, 'json.json'),
                }],
                folders: [],
            });

        const testFile = join(inputDir, 'test.json');

        const bulldog = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
        });

        await bulldog.watch();

        writeJSONSync(testFile, { nice: 'test' });

        await new Promise((resolve) =>
        {
            setTimeout(resolve, 1500);
        });

        expect(existsSync(join(outputDir, 'test.json'))).toBe(true);
        expect(existsSync(join(outputDir, 'json.json'))).toBe(true);

        removeSync(testFile);

        await new Promise((resolve) =>
        {
            setTimeout(resolve, 1500);
        });

        await bulldog.stop();

        expect(existsSync(join(outputDir, 'test.json'))).toBe(false);
        expect(existsSync(join(outputDir, 'json.json'))).toBe(true);
    });

    it('should ignore specified files when watching', async () =>
    {
        const testName = 'watch-ignore';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [{
                    name: 'scripts',
                    files: [{
                        name: 'json.json',
                        content: assetPath(pkg, 'json.json'),
                    }],
                    folders: [],
                }],
            });

        const testFile = join(inputDir, 'scripts/test.json');

        const bulldog = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            ignore: ['**/scripts/**/*'],
        });

        await bulldog.watch();

        writeJSONSync(testFile, { nice: 'test' });

        // wait a second...
        await new Promise((resolve) =>
        {
            setTimeout(resolve, 1500);
        });

        await bulldog.stop();

        expect(existsSync(join(outputDir, 'scripts/json.json'))).toBe(false);
        expect(existsSync(join(outputDir, 'scripts/test.json'))).toBe(false);
    });

    it('should provide the correct options overrides to the plugin', async () =>
    {
        const testName = 'plugin-options-override';
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
                        folders: [
                            {
                                name: 'test',
                                files: [],
                                folders: [],
                            }
                        ],
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

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                json: plugin as Plugin<any>,
            },
            cache: false,
            files: [
                {
                    files: ['anything/**'],
                    settings: {
                        json: {
                            test: 'test',
                        },
                    },
                    tags: [],
                },
            ]
        });

        const treePath = join(inputDir, 'anything/test');
        const treePath2 = join(inputDir, 'anything');
        const plug = assetpack['_processor']['_plugins'][0];

        const opts = assetpack['_processor']['getOptions'](treePath, plug);
        const optsBad = assetpack['_processor']['getOptions'](treePath2, plug);

        expect(opts).toEqual({
            test: 'test',
        });
        expect(optsBad).toEqual({});
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
