import fs from 'fs-extra';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { AssetPack, BuildReporter } from '../../src/core/index.js';
import { texturePacker } from '../../src/texture-packer/texturePacker.js';
import { createTPSFolder } from '../utils/createTPSFolder.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

import type { File } from '../utils/index.js';

const pkg = 'texture-packer';

describe('Texture Packer', () => {
    it('should create a sprite sheet', async () => {
        const testName = 'tp-simple';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createTPSFolder(testName, pkg);

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1 },
                    },
                }),
            ],
        });

        await assetpack.run();

        const sheet1 = fs.readJSONSync(`${outputDir}/sprites.json`);

        const expectedAnim = ['png-1.png', 'png-2.png'];

        expect(sheet1.animations).toEqual(expectedAnim);

        const expectedSize = {
            w: 545,
            h: 570,
        };

        expect(sheet1.meta.size).toEqual(expectedSize);

        const sheet2Exists = existsSync(`${outputDir}/sprites-1.json`);

        expect(sheet2Exists).toBe(false);

        expect(existsSync(`${outputDir}/sprites`)).toBe(false);
    });

    it('should create a sprite sheet: power of two', async () => {
        const testName = 'tp-pot';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createTPSFolder(testName, pkg);

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    texturePacker: {
                        powerOfTwo: true,
                    },
                    resolutionOptions: {
                        resolutions: { default: 1 },
                    },
                }),
            ],
        });

        await assetpack.run();

        const sheet1 = fs.readJSONSync(`${outputDir}/sprites.json`);

        const expectedSize = {
            w: 1024,
            h: 512,
        };

        expect(sheet1.meta.size).toEqual(expectedSize);

        const sheet2Exists = existsSync(`${outputDir}/sprites-1.json`);

        expect(sheet2Exists).toBe(false);

        expect(existsSync(`${outputDir}/sprites`)).toBe(false);
    });

    it('should adjust the size of the textures outputted based on maximumTextureSize', async () => {
        const testName = 'tp-max-size';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createTPSFolder(testName, pkg);

        const size = 512;

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1, low: 0.5 },
                        maximumTextureSize: size,
                    },
                }),
            ],
        });

        await assetpack.run();

        const sheet1 = fs.readJSONSync(`${outputDir}/sprites-0.json`);
        const sheet2 = fs.readJSONSync(`${outputDir}/sprites-1.json`);

        expect(sheet1.meta.size.w).toBeLessThanOrEqual(size);
        expect(sheet1.meta.size.h).toBeLessThanOrEqual(size);

        expect(sheet2.meta.size.w).toBeLessThanOrEqual(size);
        expect(sheet2.meta.size.h).toBeLessThanOrEqual(size);
    });

    it('should override default texture packer options', async () => {
        const testName = 'tp-custom';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createTPSFolder(testName, pkg);

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1 },
                    },
                    texturePacker: {
                        textureName: 'something',
                    },
                }),
            ],
        });

        await assetpack.run();

        const json = existsSync(`${outputDir}/something.json`);
        const png = existsSync(`${outputDir}/something.png`);

        expect(png).toBe(true);
        expect(json).toBe(true);
    });

    it('should override default texture packer options (resolutions)', async () => {
        const testName = 'tp-custom-res';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createTPSFolder(testName, pkg);

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        resolutions: { low: 0.5, default: 1, high: 2 },
                        fixedResolution: 'default',
                    },
                    texturePacker: {
                        removeFileExtension: true,
                    },
                }),
            ],
        });

        await assetpack.run();

        expect(existsSync(`${outputDir}/sprites@0.5x.json`)).toBe(true);
        expect(existsSync(`${outputDir}/sprites.json`)).toBe(true);
        expect(existsSync(`${outputDir}/sprites@2x.json`)).toBe(true);
        expect(existsSync(`${outputDir}/sprites@0.5x.png`)).toBe(true);
        expect(existsSync(`${outputDir}/sprites.png`)).toBe(true);
        expect(existsSync(`${outputDir}/sprites@2x.png`)).toBe(true);

        const sheet1Data = fs.readJSONSync(`${outputDir}/sprites.json`);
        const sheet2Data = fs.readJSONSync(`${outputDir}/sprites@2x.json`);
        const sheet3Data = fs.readJSONSync(`${outputDir}/sprites@0.5x.json`);

        expect(sheet2Data.frames.sprite0.frame).toEqual({ x: 200, y: 432, w: 136, h: 196 });
        expect(sheet2Data.meta.size).toEqual({ w: 545, h: 570 });
        expect(sheet2Data.meta.scale).toEqual(2);
        expect(sheet1Data.frames.sprite0.frame).toEqual({ x: 104, y: 227, w: 70, h: 101 });
        expect(sheet1Data.meta.size).toEqual({ w: 284, h: 299 });
        expect(sheet1Data.meta.scale).toEqual(1);
        expect(sheet3Data.frames.sprite0.frame).toEqual({ x: 56, y: 90, w: 36, h: 52 });
        expect(sheet3Data.meta.size).toEqual({ w: 157, h: 162 });
        expect(sheet3Data.meta.scale).toEqual(0.5);

        const meta = await sharp(`${outputDir}/sprites@2x.png`).metadata();
        const meta2 = await sharp(`${outputDir}/sprites.png`).metadata();
        const meta3 = await sharp(`${outputDir}/sprites@0.5x.png`).metadata();

        expect(meta.width).toEqual(545);
        expect(meta.height).toEqual(570);

        expect(meta2.width).toEqual(284);
        expect(meta2.height).toEqual(299);

        expect(meta3.width).toEqual(157);
        expect(meta3.height).toEqual(162);
    });

    it('should allow tags to be overridden', async () => {
        const testName = 'tp-tag-override';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        for (let i = 0; i < 10; i++) {
            sprites.push({
                name: `sprite${i}.png`,
                content: assetPath(`image/sp-${i + 1}.png`),
            });
        }

        createFolder(pkg, {
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

        const tps = texturePacker({
            resolutionOptions: {
                resolutions: { default: 1 },
            },
        });

        tps.tags!.tps = 'random';
        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [tps],
        });

        await assetpack.run();

        const sheet1 = fs.readJSONSync(`${outputDir}/sprites.json`);

        const expectedSize = {
            w: 545,
            h: 570,
        };

        expect(sheet1.meta.size).toEqual(expectedSize);

        const sheet2Exists = existsSync(`${outputDir}/sprites-1.json`);

        expect(sheet2Exists).toBe(false);
    });

    it('should create mip spritesheets', async () => {
        const testName = 'tp-mip';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createTPSFolder(testName, pkg);

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [texturePacker()],
        });

        await assetpack.run();

        const sheet1 = existsSync(`${outputDir}/sprites.json`);
        const sheet2 = existsSync(`${outputDir}/sprites@0.5x.json`);

        expect(sheet1).toBe(true);
        expect(sheet2).toBe(true);

        // check to see if the size of the 0.5 asset is half the size of the 1x asset
        const expectedSize = {
            w: 284,
            h: 299,
        };

        const sheetJson = fs.readJSONSync(`${outputDir}/sprites@0.5x.json`);

        expect(sheetJson.meta.size).toEqual(expectedSize);
    });

    it('should resize spritesheet to fixed resolution', async () => {
        const testName = 'tp-fix';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        for (let i = 0; i < 10; i++) {
            sprites.push({
                name: `sprite${i}.png`,
                content: assetPath(`image/sp-${i + 1}.png`),
            });
        }

        createFolder(pkg, {
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

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [texturePacker({ resolutionOptions: { fixedResolution: 'low' } })],
        });

        await assetpack.run();

        const sheet1 = existsSync(`${outputDir}/sprites/sprites.json`);
        const sheet2 = existsSync(`${outputDir}/sprites/sprites@0.5x.json`);
        const sheet3 = existsSync(`${outputDir}/sprites/sprites@2x.json`);
        const img = existsSync(`${outputDir}/sprites/sprites.png`);
        const img2 = existsSync(`${outputDir}/sprites/sprites@0.5x.png`);
        const img3 = existsSync(`${outputDir}/sprites/sprites@2x.png`);

        expect(sheet1).toBe(false);
        expect(sheet2).toBe(true);
        expect(sheet3).toBe(false);
        expect(img).toBe(false);
        expect(img2).toBe(true);
        expect(img3).toBe(false);
    });

    it('should not create any mipmaps for the spritesheet', async () => {
        const testName = 'tp-nomip';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        for (let i = 0; i < 10; i++) {
            sprites.push({
                name: `sprite${i}.png`,
                content: assetPath(`image/sp-${i + 1}.png`),
            });
        }

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'sprites{nomip}',
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

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [texturePacker({ resolutionOptions: { fixedResolution: 'low' } })],
        });

        await assetpack.run();

        const sheet1 = existsSync(`${outputDir}/sprites/sprites.json`);
        const sheet2 = existsSync(`${outputDir}/sprites/sprites@0.5x.json`);
        const sheet3 = existsSync(`${outputDir}/sprites/sprites@2x.json`);
        const img = existsSync(`${outputDir}/sprites/sprites.png`);
        const img2 = existsSync(`${outputDir}/sprites/sprites@0.5x.png`);
        const img3 = existsSync(`${outputDir}/sprites/sprites@2x.png`);

        expect(sheet1).toBe(true);
        expect(sheet2).toBe(false);
        expect(sheet3).toBe(false);
        expect(img).toBe(true);
        expect(img2).toBe(false);
        expect(img3).toBe(false);
    });

    it('should create jpg spritesheets', async () => {
        const testName = 'tp-jpg';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        for (let i = 0; i < 10; i++) {
            sprites.push({
                name: `sprite${i}.png`,
                content: assetPath(`image/sp-${i + 1}.png`),
            });
        }

        createFolder(pkg, {
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

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [texturePacker()],
        });

        await assetpack.run();

        const sheet1 = existsSync(`${outputDir}/sprites.json`);
        const sheet2 = existsSync(`${outputDir}/sprites.jpg`);
        const sheet3 = existsSync(`${outputDir}/sprites.png`);

        expect(sheet1).toBe(true);
        expect(sheet2).toBe(true);
        expect(sheet3).toBe(false);
    });

    it('should create short names in sprite sheets', async () => {
        const testName = 'tp-short-names';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        for (let i = 0; i < 10; i++) {
            sprites.push({
                name: `sprite${i}.png`,
                content: assetPath(`image/sp-${i + 1}.png`),
            });
        }

        createFolder(pkg, {
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

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: { resolutions: { default: 1 } },
                }),
            ],
        });

        await assetpack.run();

        const json = fs.readJSONSync(`${outputDir}/sprites.json`);

        for (let i = 0; i < 10; i++) {
            expect(json.frames[`sprite${i}.png`]).toBeDefined();
        }
    });

    it('should pack an empty texture if trim is true', async () => {
        const testName = 'tp-empty';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'sprites{tps}',
                    files: [
                        {
                            name: `empty-texture.png`,
                            content: assetPath(`image/empty-texture.png`),
                        },
                    ],
                    folders: [],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1 },
                    },
                }),
            ],
        });

        await assetpack.run();

        const sheet1 = fs.readJSONSync(`${outputDir}/sprites.json`);

        expect(sheet1.frames['empty-texture.png']).toEqual({
            frame: {
                x: 2,
                y: 2,
                w: 1,
                h: 35,
            },
            rotated: false,
            trimmed: false,
            spriteSourceSize: {
                x: 0,
                y: 0,
                w: 1,
                h: 35,
            },
            sourceSize: {
                w: 1,
                h: 35,
            },
        });
    });

    it('should throw warning if sprite sheet frames have the same name', async () => {
        const testName = 'tp-short-names-clash';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        for (let i = 0; i < 10; i++) {
            sprites.push({
                name: `sprite${i}.png`,
                content: assetPath(`image/sp-${i + 1}.png`),
            });
        }

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'sprites{tps}',
                    files: sprites,
                    folders: [],
                },
                {
                    name: 'sprites-copy{tps}',
                    files: sprites,
                    folders: [],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: { resolutions: { default: 1 } },
                    texturePacker: {
                        nameStyle: 'short',
                    },
                }),
            ],
        });

        // Mock console.warn
        const mockWarn = vi.spyOn(BuildReporter, 'warn').mockImplementation(() => {
            /**/
        });

        await assetpack.run();

        // Check if console.warn was called
        expect(mockWarn).toHaveBeenCalled();

        expect(mockWarn).toHaveBeenCalledWith(
            `[AssetPack][texturePacker] Texture Packer Shortcut clash detected for sprite9.png, sprite8.png, sprite7.png, sprite6.png, sprite5.png, sprite4.png, sprite3.png, sprite2.png, sprite1.png, sprite0.png. This means that 'nameStyle' is set to 'short' and different sprite sheets have frames that share the same name. Please either rename the files or set 'nameStyle' in the texture packer options to 'relative'`,
        ); // Adjust this line based on expected message

        // Restore console.warn
        mockWarn.mockRestore();
    });

    it('should handle smaller than 3x3 textures if trimming is enabled', async () => {
        const testName = 'tp-small-trim';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const sprites: File[] = [];

        sprites.push({
            name: `sprite.png`,
            content: assetPath(`image/sp-1.png`),
        });

        sprites.push({
            name: `empty2x2.png`,
            content: assetPath(`image/2x2-small-empty-texture.png`),
        });

        createFolder(pkg, {
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

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: { resolutions: { default: 1 } },
                }),
            ],
        });

        // Mock console.warn

        await assetpack.run();

        const sheet1 = fs.readJSONSync(`${outputDir}/sprites.json`);

        expect(sheet1.frames['empty2x2.png']).toEqual({
            frame: {
                x: 140,
                y: 2,
                w: 2,
                h: 2,
            },
            rotated: false,
            trimmed: false,
            spriteSourceSize: {
                x: 0,
                y: 0,
                w: 2,
                h: 2,
            },
            sourceSize: {
                w: 2,
                h: 2,
            },
        });
    });
});
