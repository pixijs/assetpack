import { AssetPack } from '@play-co/assetpack-core';
import { existsSync, readJSONSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { msdfFont, sdfFont, webfont } from '../src';
import { pixiManifest } from '@play-co/assetpack-plugin-manifest';

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
                        content: assetPath(pkg, 'Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
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
                        content: assetPath(pkg, 'Roboto-Regular.otf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
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
                        content: assetPath(pkg, 'Roboto-Regular.svg'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
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
                        content: assetPath(pkg, 'Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
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
                        content: assetPath(pkg, 'Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
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
                        content: assetPath(pkg, 'Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
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

    it.skip('should generate manifest correctly', async () =>
    {
        const testName = 'webfont-manifest';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'defaultFolder{wf}',
                    files: [
                        {
                            name: 'ttf.ttf',
                            content: assetPath(pkg, 'Roboto-Regular.ttf'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'sdfFolder{sdf}',
                    files: [
                        {
                            name: 'ttf.ttf',
                            content: assetPath(pkg, 'Roboto-Regular.ttf'),
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
                webfont(), // import is breaking definition file
                sdfFont(),
                pixiManifest(),
            ]
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['defaultFolder/ttf.ttf'],
                    src: ['defaultFolder/ttf.woff2'],
                    data: {
                        tags: {
                            wf: true,
                        }
                    }
                },
                {
                    alias: ['sdfFolder/ttf.ttf'],
                    src: ['sdfFolder/ttf.fnt'],
                    data: {
                        tags: {
                            sdf: true,
                        }
                    }
                },
            ],
        });
    });
});
