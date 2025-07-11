import fs from 'fs-extra';
import { existsSync } from 'node:fs';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { cacheBuster } from '../../src/cache-buster/cacheBuster.js';
import { AssetPack } from '../../src/core/AssetPack.js';
import { getHash } from '../../src/core/index.js';
import { logAssetGraph } from '../../src/core/utils/logAssetGraph.js';
import { pixiManifest } from '../../src/manifest/pixiManifest.js';
import { pixiPipes } from '../../src/pixi/index.js';
import {
    assetPath,
    createAssetPipe,
    createFolder,
    getCacheDir,
    getInputDir,
    getOutputDir
} from '../utils/index.js';

import type { AssetPipe } from '../../src/core/pipes/AssetPipe.js';
import type { MockAssetPipe } from '../utils/index.js';

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

        const plugin = createAssetPipe({
            folder: false,
            test: true,
            start: true,
            finish: true,
            transform: true,
        }) as unknown as MockAssetPipe;

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            pipes: [
                plugin as unknown as AssetPipe,
            ],
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
        const inputDir = `${getInputDir(pkg, testName)}/`;
        const outputDir = getOutputDir(pkg, testName);

        fs.removeSync(inputDir);

        createFolder(
            pkg,
            {
                name: testName,
                files: [{
                    name: 'json.json',
                    content: assetPath('json/json.json'),
                }],
                folders: [],
            });

        const testFile = join(inputDir, 'new-json-file.json');

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: true,
        });

        await assetpack.watch();

        expect(existsSync(join(outputDir, 'json.json'))).toBe(true);

        fs.writeJSONSync(testFile, { nice: 'test' });

        await new Promise((resolve) =>
        {
            setTimeout(resolve, 1500);
        });

        expect(existsSync(join(outputDir, 'new-json-file.json'))).toBe(true);
        expect(existsSync(join(outputDir, 'json.json'))).toBe(true);
        fs.writeJSONSync(join(inputDir, 'json.json'), { nice: 'test' });

        fs.removeSync(testFile);

        await new Promise((resolve) =>
        {
            setTimeout(resolve, 1500);
        });

        await assetpack.stop();

        expect(existsSync(join(outputDir, 'new-json-file.json'))).toBe(false);
        expect(existsSync(join(outputDir, 'json.json'))).toBe(true);
        expect(fs.readJSONSync(join(outputDir, 'json.json'))).toStrictEqual({ nice: 'test' });
    });

    it('should delete previously hashed versions of an asset', { timeout: 10000 }, async () =>
    {
        const testName = 'watch-delete-hash';
        const inputDir = `${getInputDir(pkg, testName)}/`;
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [{
                    name: 'json.json',
                    content: assetPath('json/json.json'),
                }],
                folders: [],
            });

        const testFile = join(inputDir, 'json.json');

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: true,
            pipes: [
                cacheBuster(),
                pixiManifest(),
            ]
        });

        await assetpack.watch();

        const origHash = getHash(join(inputDir, 'json.json'));

        expect(existsSync(join(outputDir, `json-${origHash}.json`))).toBe(true);

        fs.writeJSONSync(testFile, { nice: 'test' });

        await new Promise((resolve) =>
        {
            setTimeout(resolve, 1500);
        });

        expect(existsSync(join(outputDir, `json-${origHash}.json`))).toBe(false);
        const newHash = getHash(join(inputDir, 'json.json'));

        expect(existsSync(join(outputDir, `json-${newHash}.json`))).toBe(true);

        fs.removeSync(testFile);

        await new Promise((resolve) =>
        {
            setTimeout(resolve, 1500);
        });

        await assetpack.stop();

        expect(existsSync(join(outputDir, `json-${origHash}.json`))).toBe(false);
        expect(existsSync(join(outputDir, `json-${newHash}.json`))).toBe(false);
        expect(fs.readJSONSync(join(outputDir, 'manifest.json'))).toStrictEqual({
            bundles: [
                {
                    name: 'default',
                    assets: []
                }]
        });
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
                        content: assetPath('json/json.json'),
                    }],
                    folders: [],
                }],
            });

        const testFile = join(inputDir, 'scripts/test.json');

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            ignore: ['**/scripts/**/*'],
        });

        await assetpack.watch();

        fs.writeJSONSync(testFile, { nice: 'test' });

        // wait a second...
        await new Promise((resolve) =>
        {
            setTimeout(resolve, 1500);
        });

        await assetpack.stop();

        expect(existsSync(join(outputDir, 'scripts/json.json'))).toBe(false);
        expect(existsSync(join(outputDir, 'scripts/test.json'))).toBe(false);
    });

    it('should copy assets when copy tag is used', async () =>
    {
        const testName = 'copy-tag';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [{
                    name: 'scripts{copy}',
                    files: [{
                        name: 'json.json',
                        content: assetPath('json/json.json'),
                    }],
                    folders: [],
                },
                {
                    name: 'scripts2',
                    files: [{
                        name: 'json{copy}.json',
                        content: assetPath('json/json.json'),
                    }],
                    folders: [],
                }],
            });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            ignore: ['**/scripts/**/*'],
        });

        await assetpack.run();

        expect(existsSync(join(outputDir, 'scripts/json.json'))).toBe(true);
        expect(existsSync(join(outputDir, 'scripts2/json.json'))).toBe(true);
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

        const plugin = createAssetPipe({
            folder: false,
            test: true,
            start: true,
            finish: true,
            transform: true,
        });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            pipes: [
                plugin
            ],
            cache: false,
            assetSettings: [
                {
                    files: ['anything/**'],
                    settings: {
                        json: {
                            test: 'test',
                        },
                    },
                    metaData: [],
                },
            ],
        });

        await assetpack.run();

        const rootAsset = assetpack['_assetWatcher']['_root'].children[0];

        logAssetGraph(rootAsset);

        expect(rootAsset.children[0].settings).toStrictEqual({
            json: {
                test: 'test',
            },
        });

        expect(rootAsset.settings).toBeUndefined();
    });

    it('should generate correct stats', async () =>
    {
        const testName = 'core-stats';
        const inputDir = `${getInputDir(pkg, testName)}/`;
        const outputDir = getOutputDir(pkg, testName);

        fs.removeSync(inputDir);

        createFolder(
            pkg,
            {
                name: testName,
                files: [{
                    name: 'json.json',
                    content: assetPath('json/json.json'),
                }],
                folders: [],
            });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false
        });

        await assetpack.run();

        const stats = assetpack.rootAsset.children[0].stats!;

        expect(stats.date).toBeGreaterThan(0);
        expect(stats.duration).toBeGreaterThan(0);
        expect(stats.success).toBe(true);
    });

    it('should generate correct stats when cacheing', async () =>
    {
        const testName = 'core-stats-cache';
        const inputDir = `${getInputDir(pkg, testName)}/`;
        const outputDir = getOutputDir(pkg, testName);

        fs.removeSync(inputDir);

        createFolder(
            pkg,
            {
                name: testName,
                files: [{
                    name: 'json.json',
                    content: assetPath('json/json.json'),
                }],
                folders: [],
            });

        const testFile = join(inputDir, 'json.json');

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: true
        });

        fs.writeJSONSync(testFile, { nice: `old value!` });

        await assetpack.run();

        const stats = assetpack.rootAsset.children[0].stats!;

        expect(stats.date).toBeGreaterThan(0);
        expect(stats.duration).toBeGreaterThan(0);
        expect(stats.success).toBe(true);

        //

        const date = stats.date;

        await assetpack.run();

        // // should maintain the same stats..
        const stats2 = assetpack.rootAsset.children[0].stats!;

        expect(stats2.date).toBe(date);
        expect(stats2.duration).toBe(stats.duration);
        expect(stats2.success).toBe(true);

        fs.writeJSONSync(testFile, { nice: 'new value!' });

        await assetpack.run();

        const stats3 = assetpack.rootAsset.children[0].stats!;

        expect(stats3.date).toBeGreaterThan(stats.date);
        expect(stats3.success).toBe(true);
    });

    it('should return the root asset', () =>
    {
        const testName = 'root-asset';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false
        });

        expect(assetpack.rootAsset).toBeDefined();
    });

    it('should run multipipes correctly', async () =>
    {
        const testName = 'multipipe-asset';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [{
                    name: 'json.json',
                    content: assetPath('json/json.json'),
                }],
                folders: [],
            });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                pixiPipes({})
            ]
        });

        await assetpack.run();

        expect(existsSync(join(outputDir, 'manifest.json'))).toBe(true);
    });

    it('should call onComplete when the asset pack run is complete when watching', async () =>
    {
        const testName = 'watch-onComplete';
        const inputDir = `${getInputDir(pkg, testName)}/`;
        const outputDir = getOutputDir(pkg, testName);

        fs.removeSync(inputDir);

        createFolder(
            pkg,
            {
                name: testName,
                files: [{
                    name: 'json.json',
                    content: assetPath('json/json.json'),
                }],
                folders: [],
            });

        const testFile = join(inputDir, 'json.json');

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: true
        });

        const onComplete = vi.fn();

        await assetpack.watch(onComplete);

        expect(onComplete).toHaveBeenCalledTimes(1);

        fs.writeJSONSync(testFile, { nice: `old value!` });

        await new Promise((resolve) =>
        {
            setTimeout(resolve, 1500);
        });

        expect(onComplete).toHaveBeenCalledTimes(2);

        assetpack.stop();
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
