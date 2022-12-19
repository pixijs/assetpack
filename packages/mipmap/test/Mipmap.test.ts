import { Assetpack } from '@assetpack/core';
import { mipmap, spineAtlasMipmap } from '@assetpack/mipmap';
import { existsSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';

const pkg = 'mipmap';

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
            resolutions: {
                high: 2,
                default: 1,
                low: 0.5,
            },
        };

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                mipmap: mipmap(opts),
                spine: spineAtlasMipmap(opts),
            }
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/testPng@2x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng@1x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@2x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@1x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon2@2x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon2@1x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon2@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@2x.atlas`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@1x.atlas`)).toBe(true);
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
                        name: 'testPng{fix}.png',
                        content: assetPath(pkg, 'png-1.png'),
                    },
                    {
                        name: 'dragon{spine}{fix}.atlas',
                        content: assetPath(pkg, 'dragon.atlas'),
                    },
                ],
                folders: [],
            });

        const opts = {
            fixedResolution: 'low'
        };

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                mipmap: mipmap(opts),
                spine: spineAtlasMipmap(opts),
            }
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/testPng@2x.png`)).toBe(false);
        expect(existsSync(`${outputDir}/testPng@1x.png`)).toBe(false);
        expect(existsSync(`${outputDir}/testPng@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@2x.atlas`)).toBe(false);
        expect(existsSync(`${outputDir}/dragon@1x.atlas`)).toBe(false);
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

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                mipmap: mipmap({}),
                spine: spineAtlasMipmap(),
            }
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/testPng@1x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg@1x.jpg`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg@0.5x.jpg`)).toBe(true);
        expect(existsSync(`${outputDir}/dragon@1x.atlas`)).toBe(true);
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

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                mipmap: mipmap({}),
                spine: spineAtlasMipmap(),
            }
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/assets/test@1x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/test@0.5x.png`)).toBe(false);
        expect(existsSync(`${outputDir}/assets/dragon@1x.atlas`)).toBe(true);
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
                            {
                                name: 'dragon{spine}.atlas',
                                content: assetPath(pkg, 'dragon.atlas'),
                            },
                        ],
                        folders: [],
                    },
                ],
            });

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                mipmap: mipmap({})
            }
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/assets/test@1x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/assets/test@0.5x.png`)).toBe(false);
    });
});
