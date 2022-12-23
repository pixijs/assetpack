import { Assetpack } from '@assetpack/core';
import { texturePacker } from '@assetpack/texture-packer';
import { existsSync, readJSONSync } from 'fs-extra';
import type { File } from '../../../shared/test/index';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test/index';

const pkg = 'texture-packer';

function genFolder(testName: string)
{
    const sprites: File[] = [];

    for (let i = 0; i < 10; i++)
    {
        sprites.push({
            name: `sprite${i}.png`,
            content: assetPath(pkg, `sp-${i + 1}.png`),
        });
    }
    createFolder(
        pkg,
        {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'sprites{tps}',
                    files: sprites,
                    folders: [],
                },
            ],
        });
}

describe('Texture Packer', () =>
{
    it('should create a sprite sheet', async () =>
    {
        const testName = 'tp-simple';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        genFolder(testName);

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                tps: texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1 },
                    },
                })
            }
        });

        await assetpack.run();

        const sheet1 = readJSONSync(`${outputDir}/sprites/sprites@1x.json`);

        const expectedSize =  {
            w: 560,
            h: 480,
        };

        expect(sheet1.meta.size).toEqual(expectedSize);

        const sheet2Exists = existsSync(`${outputDir}/sprites/sprites-1@1x.json`);

        expect(sheet2Exists).toBe(false);
    });

    it('should adjust the size of the textures outputted based on maximumTextureSize', async () =>
    {
        const testName = 'tp-max-size';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        genFolder(testName);

        const size = 512;
        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                tps: texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1 },
                        maximumTextureSize: size,
                    },
                })
            }
        });

        await assetpack.run();

        const sheet1 = readJSONSync(`${outputDir}/sprites/sprites-0@1x.json`);
        const sheet2 = readJSONSync(`${outputDir}/sprites/sprites-1@1x.json`);

        expect(sheet1.meta.size.w).toBeLessThanOrEqual(size);
        expect(sheet1.meta.size.h).toBeLessThanOrEqual(size);

        expect(sheet2.meta.size.w).toBeLessThanOrEqual(size);
        expect(sheet2.meta.size.h).toBeLessThanOrEqual(size);
    });

    it('should override default texture packer options', async () =>
    {
        const testName = 'tp-custom';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        genFolder(testName);

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                tps: texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1 },
                    },
                    texturePacker: {
                        textureName: 'something',
                    }
                })
            }
        });

        await assetpack.run();

        const json = existsSync(`${outputDir}/sprites/something@1x.json`);
        const png = existsSync(`${outputDir}/sprites/something@1x.png`);

        expect(png).toBe(true);
        expect(json).toBe(true);
    });

    it('should allow tags to be overridden', async () =>
    {
        const testName = 'tp-tag-override';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        for (let i = 0; i < 10; i++)
        {
            sprites.push({
                name: `sprite${i}.png`,
                content: assetPath(pkg, `sp-${i + 1}.png`),
            });
        }

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'sprites{random}',
                        files: sprites,
                        folders: [],
                    },
                ],
            });

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                tps: texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1 },
                    },
                    tags: {
                        tps: 'random',
                    }
                })
            }
        });

        await assetpack.run();

        const sheet1 = readJSONSync(`${outputDir}/sprites/sprites@1x.json`);

        const expectedSize =  {
            w: 560,
            h: 480,
        };

        expect(sheet1.meta.size).toEqual(expectedSize);

        const sheet2Exists = existsSync(`${outputDir}/sprites/sprites-1@1x.json`);

        expect(sheet2Exists).toBe(false);
    });

    it('should create mip spritesheets', async () =>
    {
        const testName = 'tp-mip';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        genFolder(testName);

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                tps: texturePacker(),
            }
        });

        await assetpack.run();

        const sheet1 = existsSync(`${outputDir}/sprites/sprites@1x.json`);
        const sheet2 = existsSync(`${outputDir}/sprites/sprites@0.5x.json`);

        expect(sheet1).toBe(true);
        expect(sheet2).toBe(true);

        // check to see if the size of the 0.5 asset is half the size of the 1x asset
        const expectedSize =  {
            w: 560 / 2,
            h: 480 / 2,
        };

        const sheetJson = readJSONSync(`${outputDir}/sprites/sprites@0.5x.json`);

        expect(sheetJson.meta.size).toEqual(expectedSize);
    });

    it('should not create mip spritesheets', async () =>
    {
        const testName = 'tp-fix';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        for (let i = 0; i < 10; i++)
        {
            sprites.push({
                name: `sprite${i}.png`,
                content: assetPath(pkg, `sp-${i + 1}.png`),
            });
        }

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'sprites{fix}',
                        files: [],
                        folders: [
                            {
                                name: 'sprites{tps}',
                                files: sprites,
                                folders: [],
                            },
                        ],
                    },
                ],
            });

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                tps: texturePacker()
            }
        });

        await assetpack.run();

        const sheet1 = existsSync(`${outputDir}/sprites/sprites/sprites@1x.json`);
        const sheet2 = existsSync(`${outputDir}/sprites/sprites/sprites@0.5x.json`);
        const sheet3 = existsSync(`${outputDir}/sprites/sprites/sprites@2x.json`);

        expect(sheet1).toBe(true);
        expect(sheet2).toBe(false);
        expect(sheet3).toBe(false);
    });

    it('should create jpg spritesheets', async () =>
    {
        const testName = 'tp-jpg';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        for (let i = 0; i < 10; i++)
        {
            sprites.push({
                name: `sprite${i}.png`,
                content: assetPath(pkg, `sp-${i + 1}.png`),
            });
        }

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'sprites{tps}{jpg}',
                        files: sprites,
                        folders: [],
                    },
                ],
            });

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                tps: texturePacker(),
            }
        });

        await assetpack.run();

        const sheet1 = existsSync(`${outputDir}/sprites/sprites@1x.json`);
        const sheet2 = existsSync(`${outputDir}/sprites/sprites@1x.jpg`);
        const sheet3 = existsSync(`${outputDir}/sprites/sprites@1x.png`);

        expect(sheet1).toBe(true);
        expect(sheet2).toBe(true);
        expect(sheet3).toBe(false);
    });
});
