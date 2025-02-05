import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { mipmap } from '../../src/image/index.js';
import { spineAtlasMipmap } from '../../src/spine/spineAtlasMipmap.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'spine';

describe('Atlas Mipmap', () =>
{
    it('should allow for options to be overridden', async () =>
    {
        const testName = 'mip-overrides';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'dragon{spine}.atlas',
                        content: assetPath('spine/dragon.atlas'),
                    },
                    {
                        name: 'dragon.json',
                        content: assetPath('spine/dragon.json'),
                    },
                    {
                        name: 'dragon.png',
                        content: assetPath('spine/dragon.png'),
                    },
                    {
                        name: 'dragon2.png',
                        content: assetPath('spine/dragon2.png'),
                    },
                ],
                folders: [],
            });

        const opts = {
            mipmap: {
                resolutions: {
                    high: 2,
                    default: 1,
                    low: 0.5,
                }
            },
            compress: false
        };

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                mipmap(opts.mipmap),
                spineAtlasMipmap(opts.mipmap),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/dragon@2x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon2@2x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon2.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon2@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@2x.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@0.5x.atlas`)).toBe(true);
    });

    it('should generate the fixed resolution when using the fix tags', async () =>
    {
        const testName = 'mip-fixed';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'dragon{spine}.atlas',
                        content: assetPath('spine/dragon.atlas'),
                    },
                    {
                        name: 'dragon.png',
                        content: assetPath('spine/dragon.png'),
                    },
                    {
                        name: 'dragon2.png',
                        content: assetPath('spine/dragon2.png'),
                    },

                ],
                folders: [],
            });

        const mipmapOpts = {
            resolutions: { low: 0.5 },
            fixedResolution: 'low'
        };

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                spineAtlasMipmap(mipmapOpts),
                mipmap(mipmapOpts),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/dragon@2x.atlas`)).toBe(false);
        expect(existsSync(`${outputDir}/dragon.atlas`)).toBe(false);
        expect(existsSync(`${outputDir}/dragon@0.5x.atlas`)).toBe(true);
    });

    it('should create mip images', async () =>
    {
        const testName = 'mip';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'dragon{spine}.atlas',
                        content: assetPath('spine/dragon.atlas'),
                    },
                    {
                        name: 'dragon.png',
                        content: assetPath('spine/dragon.png'),
                    },
                    {
                        name: 'dragon2.png',
                        content: assetPath('spine/dragon2.png'),
                    },
                ],
                folders: [],
            });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                mipmap(),
                spineAtlasMipmap(),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/dragon.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@0.5x.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon2.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon2@0.5x.png`)).toBe(true);
    });

    it('should resize atlas to fixed resolution when tagged with fix', async () =>
    {
        const testName = 'mip-fixed-prevent';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'assets',
                        files: [
                            {
                                name: 'dragon{spine}{fix}.atlas',
                                content: assetPath('spine/dragon.atlas'),
                            },
                            {
                                name: 'dragon{fix}.png',
                                content: assetPath('spine/dragon.png'),
                            },
                            {
                                name: 'dragon2{fix}.png',
                                content: assetPath('spine/dragon2.png'),
                            },
                        ],
                        folders: [],
                    },
                ],
            });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                mipmap(),
                spineAtlasMipmap(),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/assets/dragon.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/dragon@0.5x.atlas`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon@0.5x.png`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon2@0.5x.png`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon.png`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/dragon2.png`)).toBe(true);
    });

    it('should resize atlas to low fixed resolution when tagged with fix', async () =>
    {
        const testName = 'mip-fixed-res';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'assets',
                        files: [
                            {
                                name: 'dragon{spine}{fix}.atlas',
                                content: assetPath('spine/dragon.atlas'),
                            },
                            {
                                name: 'dragon{fix}.png',
                                content: assetPath('spine/dragon.png'),
                            },
                            {
                                name: 'dragon2{fix}.png',
                                content: assetPath('spine/dragon2.png'),
                            },
                        ],
                        folders: [],
                    },
                ],
            });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                mipmap({ fixedResolution: 'low' }),
                spineAtlasMipmap({ fixedResolution: 'low' }),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/assets/dragon.atlas`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon@0.5x.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/dragon@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/dragon2@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/dragon.png`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon2.png`)).toBe(false);
    });

    it('should create no mipmaps', async () =>
    {
        const testName = 'mip-nomip';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'assets',
                        files: [
                            {
                                name: 'dragon{spine}{nomip}.atlas',
                                content: assetPath('spine/dragon.atlas'),
                            },
                            {
                                name: 'dragon{nomip}.png',
                                content: assetPath('spine/dragon.png'),
                            },
                            {
                                name: 'dragon2{nomip}.png',
                                content: assetPath('spine/dragon2.png'),
                            },
                        ],
                        folders: [],
                    },
                ],
            });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                mipmap({ fixedResolution: 'low' }),
                spineAtlasMipmap({ fixedResolution: 'low' }),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/assets/dragon.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/dragon@0.5x.atlas`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon@0.5x.png`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon2@0.5x.png`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon.png`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/dragon2.png`)).toBe(true);
    });
});
