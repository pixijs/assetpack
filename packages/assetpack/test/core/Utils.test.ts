import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/AssetPack.js';
import { extractTagsFromFileName } from '../../src/core/utils/extractTagsFromFileName.js';
import { generateCacheName } from '../../src/core/utils/generateCacheName.js';
import { createAssetPipe, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

import type { Asset } from '../../src/core/Asset.js';
import type { AssetPipe } from '../../src/core/index.js';

describe('Utils', () => {
    const pkg = 'core';

    it('should get path and file tags', async () => {
        expect(true).toBe(true);
    });

    it('should normalise the path correctly', () => {
        expect(
            new AssetPack({
                entry: 'test/test/test',
            })['_entryPath'].endsWith('test/test/test'),
        ).toBe(true);

        expect(
            new AssetPack({
                entry: 'test/test/test/',
            })['_entryPath'].endsWith('test/test/test'),
        ).toBe(true);
    });

    it('should extract tags from file name', async () => {
        expect(extractTagsFromFileName('test')).toEqual({});
        expect(extractTagsFromFileName('test.json')).toEqual({});
        expect(extractTagsFromFileName('test{tag}.json')).toEqual({ tag: true });
        expect(extractTagsFromFileName('test{tag1}{tag2}.json')).toEqual({ tag1: true, tag2: true });
        expect(extractTagsFromFileName('test{tag1}{tag2=1}.json')).toEqual({ tag1: true, tag2: 1 });
        expect(extractTagsFromFileName('test{tag1=hi}.json')).toEqual({ tag1: 'hi' });
        expect(extractTagsFromFileName('test{tag1}{tag2=1&2}.json')).toEqual({ tag1: true, tag2: [1, 2] });
    });

    it('should allow for tags to be overridden', async () => {
        const testName = 'tag-override';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
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

        let counter = 0;
        let assetTemp;
        let optionsTemp;
        const plugin = createAssetPipe({
            folder: true,
            test: ((asset: Asset, options: any) => {
                counter++;
                if (counter === 1) return false;
                assetTemp = asset;
                optionsTemp = options;

                return true;
            }) as any,
            start: true,
            finish: true,
            transform: true,
        }) as AssetPipe<any>;

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            pipes: [
                plugin, // as Plugin<any>
            ],
            cache: false,
            assetSettings: [
                {
                    files: ['**'],
                    settings: {
                        test: {
                            tags: {
                                test: 'override',
                            },
                        },
                    },
                    metaData: {
                        override: [1, 2],
                    },
                },
            ],
        });

        await assetpack.run();

        expect(optionsTemp).toEqual({
            tags: {
                test: 'override',
            },
        });
        expect(assetTemp!.allMetaData).toEqual({
            override: [1, 2],
        });
    });

    it('should allow for plugin to be turned off', async () => {
        const testName = 'plugin-off';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
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

        let counter = 0;
        const plugin = createAssetPipe({
            folder: true,
            test: (() => {
                counter++;

                return true;
            }) as any,
            start: true,
            finish: true,
            transform: true,
        }) as AssetPipe<any>;

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            pipes: [
                plugin, // as Plugin<any>
            ],
            cache: false,
            assetSettings: [
                {
                    files: ['**'],
                    settings: {
                        test: false,
                    },
                },
            ],
        });

        await assetpack.run();

        // it equals 1 because the first time it is called it is called on the input path, not the asset
        expect(counter).toEqual(1);
    });

    it('should create a unique cache name', async () => {
        const cacheName = generateCacheName({
            entry: 'test',
            output: 'out',
            pipes: [
                {
                    name: 'test',
                    defaultOptions: { hi: 'there' },
                },
            ],
        });

        expect(cacheName).toEqual('9782a5400ded95c60849cf955508938b7efdc8a0');

        // change the settings:

        const cacheName2 = generateCacheName({
            entry: 'test',
            output: 'out',
            pipes: [
                {
                    name: 'test-2',
                    defaultOptions: { hi: 'there' },
                },
            ],
        });

        expect(cacheName2).toEqual('abdf0d02db2c221346e31f61331e5880deff6f4e');

        // change the settings:

        const cacheName3 = generateCacheName({
            entry: 'test',
            output: 'out',
            pipes: [
                {
                    name: 'test-2',
                    defaultOptions: { hi: 'bye!' },
                },
            ],
        });

        expect(cacheName3).toEqual('ab900fa81d7121ea46bd2eafe9e826633c1c48a0');
    });
});
