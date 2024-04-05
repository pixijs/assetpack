import { AssetPack } from '@play-co/assetpack-core';
import { existsSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { mipmapCompress } from '../src/mipmapCompress';
import { spineAtlasMipmap } from '../src/spineAtlasMipmap';

const pkg = 'mipmap-compress';

describe('Mipmap', () =>
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
                        name: 'testPng.png',
                        content: assetPath(pkg, 'png-1.png'),
                    },
                    {
                        name: 'dragon{spine}.atlas',
                        content: assetPath(pkg, 'dragon.atlas'),
                    },
                    {
                        name: 'dragon.json',
                        content: assetPath(pkg, 'dragon.json'),
                    },
                    {
                        name: 'dragon.png',
                        content: assetPath(pkg, 'dragon.png'),
                    },
                    {
                        name: 'dragon2.png',
                        content: assetPath(pkg, 'dragon2.png'),
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
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [
                mipmapCompress(opts),
                spineAtlasMipmap(opts.mipmap),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/testPng@2x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng@0.5x.png`)).toBe(true);
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
                        name: 'testPng.png',
                        content: assetPath(pkg, 'png-1.png'),
                    },
                    {
                        name: 'dragon{spine}.atlas',
                        content: assetPath(pkg, 'dragon.atlas'),
                    },
                ],
                folders: [],
            });

        const mipmap = {
            resolutions: { low: 0.5 },
            fixedResolution: 'low'
        };

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [
                spineAtlasMipmap(mipmap),
                mipmapCompress({ compress: { png: true }, mipmap }),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/testPng@2x.png`)).toBe(false);
        expect(existsSync(`${outputDir}/testPng.png`)).toBe(false);
        expect(existsSync(`${outputDir}/testPng@0.5x.png`)).toBe(true);
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
                        name: 'testPng.png',
                        content: assetPath(pkg, 'png-1.png'),
                    },
                    {
                        name: 'testJpg.jpg',
                        content: assetPath(pkg, 'jpg-1.jpg'),
                    },
                    {
                        name: 'dragon{spine}.atlas',
                        content: assetPath(pkg, 'dragon.atlas'),
                    },
                ],
                folders: [],
            });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [
                mipmapCompress({ compress: false }),
                spineAtlasMipmap(),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/testPng.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.jpg`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg@0.5x.jpg`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@0.5x.atlas`)).toBe(true);
    });

    it('should prevent mipmaps on file when tagged with fix', async () =>
    {
        const testName = 'mip-fixed';
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
                                name: 'test{fix}.png',
                                content: assetPath(pkg, 'png-1.png'),
                            },
                            {
                                name: 'dragon{spine}{fix}.atlas',
                                content: assetPath(pkg, 'dragon.atlas'),
                            },
                        ],
                        folders: [],
                    },
                ],
            });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [
                mipmapCompress({ compress: false }),
                spineAtlasMipmap(),
            ]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/assets/test.png`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/test@0.5x.png`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/dragon@0.5x.atlas`)).toBe(false);
    });

    it('should prevent mipmaps on children when path is tagged', async () =>
    {
        const testName = 'mip-path-fixed';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'assets{fix}',
                        files: [
                            {
                                name: 'test.png',
                                content: assetPath(pkg, 'png-1.png'),
                            },
                        ],
                        folders: [],
                    },
                ],
            });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [mipmapCompress({ compress: false })]
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/assets/test.png`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/test@0.5x.png`)).toBe(false);
    });
});
