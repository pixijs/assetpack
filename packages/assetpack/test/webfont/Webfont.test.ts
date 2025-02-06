import fs from 'fs-extra';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { compress } from '../../src/image/compress.js';
import { mipmap } from '../../src/image/mipmap.js';
import { pixiManifest } from '../../src/manifest/index.js';
import { msdfFont, sdfFont, webfont } from '../../src/webfont/index.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'webfont';

describe('Webfont', () =>
{
    it('should generate webfont from ttf file', async () =>
    {
        const testName = 'ttf';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'ttf{wf}.ttf',
                        content: assetPath('font/Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: true,
            pipes: [
                webfont()
            ]
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/ttf.woff2`)).toBe(true);
    });

    it('should generate webfont from otf file', async () =>
    {
        const testName = 'otf';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'otf{wf}.otf',
                        content: assetPath('font/Roboto-Regular.otf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                webfont()
            ]
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/otf.woff2`)).toBe(true);
    });

    it('should generate webfont from svg file', async () =>
    {
        const testName = 'svg';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'svg{wf}.svg',
                        content: assetPath('font/Roboto-Regular.svg'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                webfont()
            ]
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/svg.woff2`)).toBe(true);
    });

    it('should generate a msdf font from ttf file', async () =>
    {
        const testName = 'msdf';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'msdf{msdf}.ttf',
                        content: assetPath('font/Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                msdfFont()
            ]
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/msdf.fnt`)).toBe(true);
        expect(existsSync(`${outputDir}/msdf.png`)).toBe(true);
    });

    it('should generate a sdf font from ttf file', async () =>
    {
        const testName = 'sdf';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'sdf{sdf}.ttf',
                        content: assetPath('font/Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                sdfFont()
            ]
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/sdf.fnt`)).toBe(true);
        expect(existsSync(`${outputDir}/sdf.png`)).toBe(true);
    });

    it('should generate a sdf font from ttf file at 1 resolution', async () =>
    {
        const testName = 'sdf-resolution';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'sdf{sdf}.ttf',
                        content: assetPath('font/Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                sdfFont(),
                mipmap({
                    fixedResolution: 'high',
                    resolutions: { high: 2, default: 1 },
                })
            ]
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/sdf.fnt`)).toBe(true);
        expect(existsSync(`${outputDir}/sdf.png`)).toBe(true);
    });

    it('should generate a split sdf font from ttf file', async () =>
    {
        const testName = 'sdf-split';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'sdf{sdf}.ttf',
                        content: assetPath('font/Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                sdfFont({
                    font: {
                        textureSize: [256, 256],
                    }
                })
            ]
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/sdf.fnt`)).toBe(true);
        expect(existsSync(`${outputDir}/sdf.0.png`)).toBe(true);
        expect(existsSync(`${outputDir}/sdf.1.png`)).toBe(true);
    });

    it('should generate manifest correctly', async () =>
    {
        const testName = 'webfont-manifest';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'defaultFolder',
                    files: [
                        {
                            name: 'ttf{wf}.ttf',
                            content: assetPath('font/Roboto-Regular.ttf'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'sdfFolder{sdf}',
                    files: [
                        {
                            name: 'ttf.ttf',
                            content: assetPath('font/Roboto-Regular.ttf'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'msdfFolder{msdf}',
                    files: [
                        {
                            name: 'ttf.ttf',
                            content: assetPath('font/Roboto-Regular.ttf'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'svgFolder{wf}',
                    files: [
                        {
                            name: 'svg.svg',
                            content: assetPath('font/Roboto-Regular.svg'),
                        },
                    ],
                    folders: [],
                }
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                webfont(),
                sdfFont(),
                msdfFont(),
                mipmap(),
                compress(),
                pixiManifest({ legacyMetaDataOutput: false }),
            ]
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await fs.readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['defaultFolder/ttf.ttf'],
                    src: ['defaultFolder/ttf.woff2'],
                    data: {
                        family: 'ttf',
                        tags: {
                            wf: true,
                        },
                    }
                },
                {
                    alias: ['msdfFolder/ttf.ttf'],
                    src: ['msdfFolder/ttf.fnt'],
                    data: {
                        family: 'ttf',
                        tags: {
                            msdf: true,
                        },
                    }
                },
                {
                    alias: ['sdfFolder/ttf.ttf'],
                    src: ['sdfFolder/ttf.fnt'],
                    data: {
                        family: 'ttf',
                        tags: {
                            sdf: true,
                        },
                    }
                },
                {
                    alias: ['svgFolder/svg.svg'],
                    src: ['svgFolder/svg.woff2'],
                    data: {
                        family: 'svg',
                        tags: {
                            wf: true,
                        },
                    }
                },
            ],
        });
    }, 10000);
});
