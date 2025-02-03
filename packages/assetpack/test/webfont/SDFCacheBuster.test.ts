import { glob } from 'glob';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cacheBuster } from '../../src/cache-buster/index.js';
import { AssetPack } from '../../src/core/index.js';
import { pixiManifest } from '../../src/manifest/index.js';
import { pixiPipes } from '../../src/pixi/index.js';
import { msdfFont, sdfFont } from '../../src/webfont/index.js';
import { SDFCacheBuster } from '../../src/webfont/sdfCacheBuster.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'webfont';

describe('Webfont', () =>
{
    it('should generate a sdf/msdf font from ttf file', async () =>
    {
        const testName = 'sdfcachebuster-sdf';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'sdf',
                        files: [
                            {
                                name: 'test{sdf}{nc}{fix}.ttf',
                                content: assetPath('font/Roboto-Regular.ttf'),
                            }],
                        folders: [],
                    },
                    {
                        name: 'compress',
                        files: [
                            {
                                name: 'test{sdf}{fix}.ttf',
                                content: assetPath('font/Roboto-Regular.ttf'),
                            }],
                        folders: [],
                    },
                    {
                        name: 'mipmap-compress',
                        files: [
                            {
                                name: 'test{sdf}.ttf',
                                content: assetPath('font/Roboto-Regular.ttf'),
                            }],
                        folders: [],
                    },
                ],
            },
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                sdfFont({
                    font: {
                        charset: '0123456789',
                    },
                    resolutionOptions: {
                        template: '@%%x',
                        resolutions: {
                            default: 1,
                            low: 0.5
                        },
                    },
                }),
                ...pixiPipes({
                    cacheBust: true,
                    resolutions: { default: 1, low: 0.5 },
                    compression: { jpg: true, png: true, webp: true },
                })
                // compress(compression),
                // sdfCompress(compression),
                // cacheBuster(),
                // SDFCacheBuster(),
                // pixiManifest({
                //     createShortcuts: true,
                // }),
            ],
        });

        await assetpack.run();

        const sdfGlobPath = path.join(outputDir, 'sdf', '*.{fnt,png,webp}')
            .replaceAll('\\', '/');
        const sdfFiles = await glob(sdfGlobPath);

        const compressGlobPath = path.join(outputDir, 'compress', '*.{fnt,png,webp}')
            .replaceAll('\\', '/');
        const compressFiles = await glob(compressGlobPath);

        const mipmapCompressGlobPath = path.join(outputDir, 'mipmap-compress', '*.{fnt,png,webp}')
            .replaceAll('\\', '/');
        const mipmapCompressFiles = await glob(mipmapCompressGlobPath);

        expect(sdfFiles.length)
            .toBe(2);
        expect(sdfFiles.filter((file) => file.endsWith('.fnt')).length)
            .toBe(1);
        expect(sdfFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(1);

        expect(compressFiles.length)
            .toBe(4);
        expect(compressFiles.filter((file) => file.endsWith('.fnt')).length)
            .toBe(2);
        expect(compressFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(1);
        expect(compressFiles.filter((file) => file.endsWith('.webp')).length)
            .toBe(1);

        expect(mipmapCompressFiles.length)
            .toBe(8);
        expect(mipmapCompressFiles.filter((file) => file.endsWith('.fnt')).length)
            .toBe(4);
        expect(mipmapCompressFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(2);
        expect(mipmapCompressFiles.filter((file) => file.endsWith('.webp')).length)
            .toBe(2);
    });

    it('should generate a msdf font from ttf file', async () =>
    {
        const testName = 'sdfcachebuster-msdf';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'msdf',
                        files: [{
                            name: 'test{msdf}{fix}.ttf',
                            content: assetPath('font/Roboto-Regular.ttf'),
                        }],
                        folders: [],
                    },
                    {
                        name: 'mipmap',
                        files: [{
                            name: 'test{msdf}.ttf',
                            content: assetPath('font/Roboto-Regular.ttf'),
                        }],
                        folders: [],
                    },
                ],
            },
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                msdfFont({
                    font: {
                        charset: '0123456789',
                    },
                    resolutionOptions: {
                        template: '@%%x',
                        resolutions: {
                            default: 1,
                            low: 0.5,
                        },
                    },
                }),
                cacheBuster(),
                SDFCacheBuster(),
                pixiManifest({
                    createShortcuts: true,
                }),
            ],
        });

        await assetpack.run();

        const msdfGlobPath = path.join(outputDir, 'msdf', '*.{fnt,png}')
            .replaceAll('\\', '/');
        const msdfFiles = await glob(msdfGlobPath);

        const mipmapGlobPath = path.join(outputDir, 'mipmap', '*.{fnt,png}')
            .replaceAll('\\', '/');
        const mipmapFiles = await glob(mipmapGlobPath);

        expect(msdfFiles.length)
            .toBe(2);
        expect(msdfFiles.filter((file) => file.endsWith('.fnt')).length)
            .toBe(1);
        expect(msdfFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(1);

        expect(mipmapFiles.length)
            .toBe(4);
        expect(mipmapFiles.filter((file) => file.endsWith('.fnt')).length)
            .toBe(2);
        expect(mipmapFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(2);
    });

    it('should generate a split sdf font from ttf file', async () =>
    {
        const testName = 'sdfcachebuster-split';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'a',
                        files: [
                            {
                                name: 'test{sdf}.ttf',
                                content: assetPath('font/Roboto-Regular.ttf'),
                            }],
                        folders: [],
                    },
                    {
                        name: 'b',
                        files: [
                            {
                                name: 'test{sdf}.ttf',
                                content: assetPath('font/Roboto-Regular.ttf'),
                            }],
                        folders: [],
                    },
                ],
            },
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                sdfFont({
                    font: {
                        textureSize: [128, 128],
                    },
                }),
                cacheBuster(),
                SDFCacheBuster(),
            ],
        });

        await assetpack.run();

        const aPath = path.join(outputDir, 'a', '*.{fnt,png}')
            .replaceAll('\\', '/');
        const aFiles = await glob(aPath);

        const bPath = path.join(outputDir, 'b', '*.{fnt,png}')
            .replaceAll('\\', '/');
        const bFiles = await glob(bPath);

        expect(aFiles.length)
            .toBe(6);
        expect(aFiles.filter((file) => file.endsWith('.fnt')).length)
            .toBe(1);
        expect(aFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(5);

        expect(bFiles.length)
            .toBe(6);
        expect(bFiles.filter((file) => file.endsWith('.fnt')).length)
            .toBe(1);
        expect(bFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(5);
    });

    it('should clone xml and change file in page', async () =>
    {
        const testName = 'sdfcachebuster-xml';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'copy',
                        files: [
                            {
                                name: 'desyrel{copy}.xml',
                                content: assetPath('font/desyrel.xml'),
                            },
                            {
                                name: 'desyrel{copy}.png',
                                content: assetPath('font/desyrel.png'),
                            }],
                        folders: [],
                    },
                    {
                        name: 'cachebuster',
                        files: [
                            {
                                name: 'desyrel{sdf}{nc}{fix}.xml',
                                content: assetPath('font/desyrel.xml'),
                            },
                            {
                                name: 'desyrel{nc}{fix}.png',
                                content: assetPath('font/desyrel.png'),
                            }],
                        folders: [],
                    },
                    {
                        name: 'compress',
                        files: [
                            {
                                name: 'desyrel{sdf}{fix}.xml',
                                content: assetPath('font/desyrel.xml'),
                            },
                            {
                                name: 'desyrel{sdf}{fix}.png',
                                content: assetPath('font/desyrel.png'),
                            }],
                        folders: [],
                    },
                    {
                        name: 'disable-mipmap',
                        files: [
                            {
                                name: 'desyrel{sdf}.xml',
                                content: assetPath('font/desyrel.xml'),
                            },
                            {
                                name: 'desyrel{sdf}.png',
                                content: assetPath('font/desyrel.png'),
                            }],
                        folders: [],
                    },
                ],
            },
        );

        const mipmapOptions = {
            template: '@%%x',
            resolutions: { default: 1, low: 0.5 },
            fixedResolution: 'default',
        };

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                sdfFont({
                    resolutionOptions: {
                        ...mipmapOptions
                    }
                }),
                ...pixiPipes({
                    cacheBust: true,
                    resolutions: { ...mipmapOptions.resolutions },
                    compression: { jpg: true, png: true, webp: true },
                })
            ],
        });

        await assetpack.run();

        const copyGlobPath = path.join(outputDir, 'copy', '*.{xml,png}')
            .replaceAll('\\', '/');
        const copyFiles = await glob(copyGlobPath);

        const cachebusterGlobPath = path.join(outputDir, 'cachebuster', '*.{xml,png}')
            .replaceAll('\\', '/');
        const cachebusterFiles = await glob(cachebusterGlobPath);

        const compressGlobPath = path.join(outputDir, 'compress', '*.{xml,png,webp}')
            .replaceAll('\\', '/');
        const compressFiles = await glob(compressGlobPath);

        const disableMipmapGlobPath = path.join(outputDir, 'disable-mipmap', '*.{xml,png,webp}')
            .replaceAll('\\', '/');
        const disableMipmapFiles = await glob(disableMipmapGlobPath);

        expect(copyFiles.length)
            .toBe(2);
        expect(copyFiles.filter((file) => file.endsWith('.xml')).length)
            .toBe(1);
        expect(copyFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(1);

        expect(cachebusterFiles.length)
            .toBe(2);
        expect(cachebusterFiles.filter((file) => file.endsWith('.xml')).length)
            .toBe(1);
        expect(cachebusterFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(1);

        expect(compressFiles.length)
            .toBe(4);
        expect(compressFiles.filter((file) => file.endsWith('.xml')).length)
            .toBe(2);
        expect(compressFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(1);
        expect(compressFiles.filter((file) => file.endsWith('.webp')).length)
            .toBe(1);

        expect(disableMipmapFiles.length)
            .toBe(4);
        expect(disableMipmapFiles.filter((file) => file.endsWith('.xml')).length)
            .toBe(2);
        expect(disableMipmapFiles.filter((file) => file.endsWith('.png')).length)
            .toBe(1);
        expect(disableMipmapFiles.filter((file) => file.endsWith('.webp')).length)
            .toBe(1);
    });
});
