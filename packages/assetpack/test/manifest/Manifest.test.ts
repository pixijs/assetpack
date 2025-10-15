import fs from 'fs-extra';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cacheBuster } from '../../src/cache-buster/cacheBuster.js';
import { AssetPack } from '../../src/core/index.js';
import { audio } from '../../src/ffmpeg/index.js';
import { compress, mipmap } from '../../src/image/index.js';
import { pixiManifest } from '../../src/manifest/index.js';
import { spineAtlasCacheBuster, spineAtlasManifestMod, spineAtlasMipmap } from '../../src/spine/index.js';
import {
    texturePacker,
    texturePackerCacheBuster,
    texturePackerCompress,
    texturePackerManifestMod,
} from '../../src/texture-packer/index.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

import type { File } from '../utils/index.js';

const pkg = 'manifest';

function genSprites(total = 10) {
    const sprites: File[] = [];

    for (let i = 0; i < total; i++) {
        sprites.push({
            name: `sprite${i}.png`,
            content: assetPath(`image/sp-${i + 1}.png`),
        });
    }

    return sprites;
}

describe('Manifest', () => {
    it('should gather all transformed spritesheet files even if split into multiple files', async () => {
        const testName = 'manifest-spritesheet';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const useCache = false;

        if (!useCache) {
            createFolder(pkg, {
                name: testName,
                files: [],

                folders: [
                    {
                        name: 'bundle{m}',
                        files: [
                            {
                                name: 'json.json',
                                content: assetPath('json/json.json'),
                            },
                            {
                                name: 'json.json5',
                                content: assetPath('json/json.json'),
                            },
                            {
                                name: 'sprite.png',
                                content: assetPath('image/sp-1.png'),
                            },
                        ],
                        folders: [
                            {
                                name: 'tps{tps}',
                                files: genSprites(),
                                folders: [],
                            },
                        ],
                    },
                    {
                        name: 'defaultFolder',
                        files: [
                            {
                                name: '1.mp3',
                                content: assetPath('audio/1.mp3'),
                            },
                            {
                                name: '3.wav',
                                content: assetPath('audio/3.wav'),
                            },
                        ],
                        folders: [],
                    },
                    {
                        name: 'spine',
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
                    },
                ],
            });
        }

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: useCache,
            pipes: [
                audio(),
                spineAtlasMipmap(),
                texturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                    addFrameNames: true,
                }),
                mipmap(),
                compress({
                    png: true,
                    jpg: true,
                    webp: true,
                    avif: false,
                    astc: true,
                }),
                texturePackerCompress({ astc: true }),
                pixiManifest(),
                spineAtlasManifestMod(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`)) as any;

        expect(manifest.bundles[1]).toEqual({
            name: 'bundle',
            assets: [
                {
                    alias: ['bundle/json.json'],
                    src: ['bundle/json.json'],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/json.json5'],
                    src: ['bundle/json.json5'],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/sprite.png'],
                    src: [
                        'bundle/sprite@0.5x.webp',
                        'bundle/sprite@0.5x.png',
                        'bundle/sprite@0.5x.astc.ktx',
                        'bundle/sprite.webp',
                        'bundle/sprite.png',
                        'bundle/sprite.astc.ktx',
                    ],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/tps'],
                    src: [
                        'bundle/tps-0@0.5x.webp.json',
                        'bundle/tps-0@0.5x.png.json',
                        'bundle/tps-0@0.5x.astc.json',
                        'bundle/tps-0.webp.json',
                        'bundle/tps-0.png.json',
                        'bundle/tps-0.astc.json',
                    ],
                    data: {
                        tags: {
                            m: true,
                            tps: true,
                            frameNames: [
                                'sprite9.png',
                                'sprite8.png',
                                'sprite7.png',
                                'sprite6.png',
                                'sprite5.png',
                                'sprite4.png',
                                'sprite3.png',
                                'sprite2.png',
                                'sprite1.png',
                                'sprite0.png',
                            ],
                        },
                        frameNames: [
                            'sprite9.png',
                            'sprite8.png',
                            'sprite7.png',
                            'sprite6.png',
                            'sprite5.png',
                            'sprite4.png',
                            'sprite3.png',
                            'sprite2.png',
                            'sprite1.png',
                            'sprite0.png',
                        ],
                    },
                },
            ],
        });
        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['defaultFolder/1.mp3'],
                    src: ['defaultFolder/1.ogg', 'defaultFolder/1.mp3'],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['defaultFolder/3.wav'],
                    src: ['defaultFolder/3.ogg', 'defaultFolder/3.mp3'],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['spine/dragon.json'],
                    src: ['spine/dragon.json'],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['spine/dragon.atlas'],
                    src: ['spine/dragon@0.5x.atlas', 'spine/dragon.atlas'],
                    data: {
                        spine: true,
                        tags: {
                            spine: true,
                        },
                    },
                },
            ],
        });
    }, 15000);

    it('should add filesize information to the manifest', async () => {
        const testName = 'manifest-filesize';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const useCache = false;

        if (!useCache) {
            createFolder(pkg, {
                name: testName,
                files: [],

                folders: [
                    {
                        name: 'bundle{m}',
                        files: [
                            {
                                name: 'json.json',
                                content: assetPath('json/json.json'),
                            },
                            {
                                name: 'json.json5',
                                content: assetPath('json/json.json'),
                            },
                            {
                                name: 'sprite.png',
                                content: assetPath('image/sp-1.png'),
                            },
                        ],
                        folders: [
                            {
                                name: 'tps{tps}',
                                files: genSprites(),
                                folders: [],
                            },
                        ],
                    },
                    {
                        name: 'defaultFolder',
                        files: [
                            {
                                name: '1.mp3',
                                content: assetPath('audio/1.mp3'),
                            },
                            {
                                name: '3.wav',
                                content: assetPath('audio/3.wav'),
                            },
                        ],
                        folders: [],
                    },
                    {
                        name: 'spine',
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
                    },
                ],
            });
        }

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: useCache,
            pipes: [
                audio(),
                spineAtlasMipmap(),
                texturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                    addFrameNames: true,
                }),
                mipmap(),
                compress({
                    png: true,
                    jpg: true,
                    webp: true,
                    avif: false,
                    astc: true,
                }),
                texturePackerCompress({ astc: true }),
                pixiManifest({ includeFileSizes: 'gzip' }),
                spineAtlasManifestMod(),
                texturePackerManifestMod({ includeFileSizes: 'gzip' }),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`)) as any;

        expect(manifest.bundles[1]).toEqual({
            name: 'bundle',
            assets: [
                {
                    alias: ['bundle/json.json'],
                    src: [{ src: 'bundle/json.json', progressSize: 0.06 }],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/json.json5'],
                    src: [{ src: 'bundle/json.json5', progressSize: 0.06 }],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/sprite.png'],
                    src: [
                        { src: 'bundle/sprite@0.5x.webp', progressSize: 3.78 },
                        { src: 'bundle/sprite@0.5x.png', progressSize: 5.21 },
                        { src: 'bundle/sprite@0.5x.astc.ktx', progressSize: 4.98 },
                        { src: 'bundle/sprite.webp', progressSize: 8.2 },
                        { src: 'bundle/sprite.png', progressSize: 14.49 },
                        { src: 'bundle/sprite.astc.ktx', progressSize: 16.57 },
                    ],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/tps'],
                    src: [
                        { src: 'bundle/tps-0@0.5x.webp.json', progressSize: 19.49 },
                        { src: 'bundle/tps-0@0.5x.png.json', progressSize: 21.34 },
                        { src: 'bundle/tps-0@0.5x.astc.json', progressSize: 26.57 },
                        { src: 'bundle/tps-0.webp.json', progressSize: 45.18 },
                        { src: 'bundle/tps-0.png.json', progressSize: 71.06 },
                        { src: 'bundle/tps-0.astc.json', progressSize: 90.86 },
                    ],
                    data: {
                        tags: {
                            m: true,
                            tps: true,
                            frameNames: [
                                'sprite9.png',
                                'sprite8.png',
                                'sprite7.png',
                                'sprite6.png',
                                'sprite5.png',
                                'sprite4.png',
                                'sprite3.png',
                                'sprite2.png',
                                'sprite1.png',
                                'sprite0.png',
                            ],
                        },
                        frameNames: [
                            'sprite9.png',
                            'sprite8.png',
                            'sprite7.png',
                            'sprite6.png',
                            'sprite5.png',
                            'sprite4.png',
                            'sprite3.png',
                            'sprite2.png',
                            'sprite1.png',
                            'sprite0.png',
                        ],
                    },
                },
            ],
        });
        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['defaultFolder/1.mp3'],
                    src: [
                        { src: 'defaultFolder/1.ogg', progressSize: 5.87 },
                        { src: 'defaultFolder/1.mp3', progressSize: 9.71 },
                    ],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['defaultFolder/3.wav'],
                    src: [
                        { src: 'defaultFolder/3.ogg', progressSize: 5.87 },
                        { src: 'defaultFolder/3.mp3', progressSize: 10.9 },
                    ],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['spine/dragon.json'],
                    src: [{ src: 'spine/dragon.json', progressSize: 3.31 }],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['spine/dragon.atlas'],
                    src: [
                        { src: 'spine/dragon@0.5x.atlas', progressSize: 0.85 },
                        { src: 'spine/dragon.atlas', progressSize: 0.87 },
                    ],
                    data: {
                        spine: true,
                        tags: {
                            spine: true,
                        },
                    },
                },
            ],
        });
    });

    it('should add filesize information to the manifest with cache busting', async () => {
        const testName = 'manifest-filesize-cache-bust';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const useCache = false;

        if (!useCache) {
            createFolder(pkg, {
                name: testName,
                files: [],

                folders: [
                    {
                        name: 'bundle{m}',
                        files: [
                            {
                                name: 'json.json',
                                content: assetPath('json/json.json'),
                            },
                            {
                                name: 'json.json5',
                                content: assetPath('json/json.json'),
                            },
                            {
                                name: 'sprite.png',
                                content: assetPath('image/sp-1.png'),
                            },
                        ],
                        folders: [
                            {
                                name: 'tps{tps}',
                                files: genSprites(),
                                folders: [],
                            },
                        ],
                    },
                    {
                        name: 'spine',
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
                    },
                ],
            });
        }

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: useCache,
            pipes: [
                audio(),
                spineAtlasMipmap(),
                texturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                    addFrameNames: true,
                }),
                mipmap(),
                compress({
                    png: true,
                    jpg: true,
                    webp: true,
                    avif: false,
                    astc: true,
                }),
                texturePackerCompress({ astc: true }),
                cacheBuster(),
                texturePackerCacheBuster(),
                spineAtlasCacheBuster(),
                pixiManifest({ includeFileSizes: 'gzip' }),
                spineAtlasManifestMod(),
                texturePackerManifestMod({ includeFileSizes: 'gzip' }),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`)) as any;

        expect(manifest.bundles[1]).toEqual({
            name: 'bundle',
            assets: [
                {
                    alias: ['bundle/json.json'],
                    src: [{ src: 'bundle/json-xnnaoQ.json', progressSize: 0.06 }],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/json.json5'],
                    src: [{ src: 'bundle/json-xnnaoQ.json5', progressSize: 0.06 }],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/sprite.png'],
                    src: [
                        { src: 'bundle/sprite-vUcaag@0.5x.astc.ktx', progressSize: 4.98 },
                        { src: 'bundle/sprite-TZpmeQ.astc.ktx', progressSize: 16.57 },
                        { src: 'bundle/sprite-sDtC@0.5x.png', progressSize: 5.21 },
                        { src: 'bundle/sprite-KdyNpA@0.5x.webp', progressSize: 3.78 },
                        { src: 'bundle/sprite-k07jiw.png', progressSize: 14.49 },
                        { src: 'bundle/sprite-3CLG.webp', progressSize: 8.2 },
                    ],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/tps'],
                    src: [
                        { src: 'bundle/tps-RzSARA-0@0.5x.astc.json', progressSize: 26.52 },
                        { src: 'bundle/tps-Ktro9A-0@0.5x.png.json', progressSize: 21.3 },
                        { src: 'bundle/tps-iS-Jog-0@0.5x.webp.json', progressSize: 19.45 },
                        { src: 'bundle/tps-G92JcQ-0.png.json', progressSize: 71.01 },
                        { src: 'bundle/tps-g4NIDQ-0.astc.json', progressSize: 90.82 },
                        { src: 'bundle/tps-bo4nog-0.webp.json', progressSize: 45.14 },
                    ],
                    data: {
                        tags: {
                            m: true,
                            tps: true,
                            frameNames: [
                                'sprite9.png',
                                'sprite8.png',
                                'sprite7.png',
                                'sprite6.png',
                                'sprite5.png',
                                'sprite4.png',
                                'sprite3.png',
                                'sprite2.png',
                                'sprite1.png',
                                'sprite0.png',
                            ],
                        },
                        frameNames: [
                            'sprite9.png',
                            'sprite8.png',
                            'sprite7.png',
                            'sprite6.png',
                            'sprite5.png',
                            'sprite4.png',
                            'sprite3.png',
                            'sprite2.png',
                            'sprite1.png',
                            'sprite0.png',
                        ],
                    },
                },
            ],
        });
        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['spine/dragon.json'],
                    src: [{ src: 'spine/dragon-cUphYw.json', progressSize: 3.31 }],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['spine/dragon.atlas'],
                    src: [
                        { src: 'spine/dragon-VMxv5A@0.5x.atlas', progressSize: 0.86 },
                        { src: 'spine/dragon-bOhE1A.atlas', progressSize: 0.89 },
                    ],
                    data: {
                        tags: {
                            spine: true,
                        },
                        spine: true,
                    },
                },
            ],
        });
    });

    it('should copy over files and add them to manifest', async () => {
        const testName = 'manifest-copy';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const useCache = false;

        createFolder(pkg, {
            name: testName,
            files: [],

            folders: [
                {
                    name: 'defaultFolder',
                    files: [
                        {
                            name: 'json{copy}.json',
                            content: assetPath('json/json.json'),
                        },
                    ],
                    folders: [
                        {
                            name: 'tps{copy}',
                            files: genSprites(3),
                            folders: [],
                        },
                        {
                            name: 'mip',
                            files: genSprites(3),
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
            cache: useCache,
            pipes: [
                mipmap(),
                compress({
                    png: true,
                    jpg: true,
                    webp: true,
                    avif: false,
                    astc: true,
                }),
                pixiManifest(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`)) as any;

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['defaultFolder/json.json'],
                    src: ['defaultFolder/json.json'],
                    data: {
                        tags: {
                            copy: true,
                        },
                    },
                },
                {
                    alias: ['defaultFolder/mip/sprite0.png'],

                    src: [
                        'defaultFolder/mip/sprite0@0.5x.webp',
                        'defaultFolder/mip/sprite0@0.5x.png',
                        'defaultFolder/mip/sprite0@0.5x.astc.ktx',
                        'defaultFolder/mip/sprite0.webp',
                        'defaultFolder/mip/sprite0.png',
                        'defaultFolder/mip/sprite0.astc.ktx',
                    ],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['defaultFolder/mip/sprite1.png'],
                    src: [
                        'defaultFolder/mip/sprite1@0.5x.webp',
                        'defaultFolder/mip/sprite1@0.5x.png',
                        'defaultFolder/mip/sprite1@0.5x.astc.ktx',
                        'defaultFolder/mip/sprite1.webp',
                        'defaultFolder/mip/sprite1.png',
                        'defaultFolder/mip/sprite1.astc.ktx',
                    ],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['defaultFolder/mip/sprite2.png'],
                    src: [
                        'defaultFolder/mip/sprite2@0.5x.webp',
                        'defaultFolder/mip/sprite2@0.5x.png',
                        'defaultFolder/mip/sprite2@0.5x.astc.ktx',
                        'defaultFolder/mip/sprite2.webp',
                        'defaultFolder/mip/sprite2.png',
                        'defaultFolder/mip/sprite2.astc.ktx',
                    ],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['defaultFolder/tps/sprite0.png'],
                    src: ['defaultFolder/tps/sprite0.png'],
                    data: {
                        tags: {
                            copy: true,
                        },
                    },
                },
                {
                    alias: ['defaultFolder/tps/sprite1.png'],
                    src: ['defaultFolder/tps/sprite1.png'],
                    data: {
                        tags: {
                            copy: true,
                        },
                    },
                },
                {
                    alias: ['defaultFolder/tps/sprite2.png'],
                    src: ['defaultFolder/tps/sprite2.png'],
                    data: {
                        tags: {
                            copy: true,
                        },
                    },
                },
            ],
        });
    }, 30000);

    it('should sort the order of the src array', async () => {
        const testName = 'manifest-src-sort';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const useCache = false;

        createFolder(pkg, {
            name: testName,
            files: [],

            folders: [
                {
                    name: 'defaultFolder',
                    files: [],
                    folders: [
                        {
                            name: 'mip',
                            files: genSprites(3),
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
            cache: useCache,
            pipes: [
                mipmap(),
                compress({
                    png: true,
                    jpg: true,
                    webp: true,
                    avif: false,
                    astc: true,
                }),
                pixiManifest({
                    srcSortOptions: { order: 'ascending' },
                }),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`)) as any;

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['defaultFolder/mip/sprite0.png'],
                    src: [
                        'defaultFolder/mip/sprite0.astc.ktx',
                        'defaultFolder/mip/sprite0.png',
                        'defaultFolder/mip/sprite0.webp',
                        'defaultFolder/mip/sprite0@0.5x.astc.ktx',
                        'defaultFolder/mip/sprite0@0.5x.png',
                        'defaultFolder/mip/sprite0@0.5x.webp',
                    ],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['defaultFolder/mip/sprite1.png'],
                    src: [
                        'defaultFolder/mip/sprite1.astc.ktx',
                        'defaultFolder/mip/sprite1.png',
                        'defaultFolder/mip/sprite1.webp',
                        'defaultFolder/mip/sprite1@0.5x.astc.ktx',
                        'defaultFolder/mip/sprite1@0.5x.png',
                        'defaultFolder/mip/sprite1@0.5x.webp',
                    ],
                    data: {
                        tags: {},
                    },
                },
                {
                    alias: ['defaultFolder/mip/sprite2.png'],
                    src: [
                        'defaultFolder/mip/sprite2.astc.ktx',
                        'defaultFolder/mip/sprite2.png',
                        'defaultFolder/mip/sprite2.webp',
                        'defaultFolder/mip/sprite2@0.5x.astc.ktx',
                        'defaultFolder/mip/sprite2@0.5x.png',
                        'defaultFolder/mip/sprite2@0.5x.webp',
                    ],
                    data: {
                        tags: {},
                    },
                },
            ],
        });
    }, 30000);

    it('should try to add a shortcut to the names of each entry', async () => {
        const testName = 'manifest-shortcut';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'folder',
                    files: [
                        {
                            name: 'json.json',
                            content: assetPath('json/json.json'),
                        },
                        {
                            name: 'json.json5',
                            content: assetPath('json/json.json'),
                        },
                        {
                            name: 'sprite.png',
                            content: assetPath('image/sp-1.png'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'folder2',
                    files: [
                        {
                            name: '1.mp3',
                            content: assetPath('audio/1.mp3'),
                        },
                    ],
                    folders: [
                        {
                            name: 'folder3',
                            files: [
                                {
                                    name: '1.mp3',
                                    content: assetPath('audio/1.mp3'),
                                },
                            ],
                            folders: [],
                        },
                    ],
                },
                {
                    name: 'spine',
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
                        maximumTextureSize: 512,
                    },
                }),
                audio(),
                mipmap(),
                spineAtlasMipmap(),
                compress({
                    webp: true,
                    png: true,
                    astc: true,
                }),
                pixiManifest({
                    createShortcuts: true,
                    trimExtensions: true,
                    includeMetaData: false,
                }),
                spineAtlasManifestMod(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`));

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['folder/json.json', 'json.json'],
                    src: ['folder/json.json'],
                },
                {
                    alias: ['folder/json.json5', 'json.json5'],
                    src: ['folder/json.json5'],
                },
                {
                    alias: ['folder/sprite.png', 'folder/sprite', 'sprite.png', 'sprite'],
                    src: [
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@0.5x.png',
                        'folder/sprite@0.5x.astc.ktx',
                        'folder/sprite.webp',
                        'folder/sprite.png',
                        'folder/sprite.astc.ktx',
                    ],
                },
                {
                    alias: ['folder2/1.mp3', 'folder2/1'],
                    src: ['folder2/1.ogg', 'folder2/1.mp3'],
                },
                {
                    alias: ['folder2/folder3/1.mp3', 'folder2/folder3/1'],
                    src: ['folder2/folder3/1.ogg', 'folder2/folder3/1.mp3'],
                },
                {
                    alias: ['spine/dragon.json', 'dragon.json'],
                    src: ['spine/dragon.json'],
                },
                {
                    alias: ['spine/dragon.atlas', 'dragon.atlas'],
                    src: ['spine/dragon@0.5x.atlas', 'spine/dragon.atlas'],
                },
            ],
        });
    });

    it('should not include spine atlas textures', async () => {
        const testName = 'manifest-shortcut-atlas-textures';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'spine',
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
                        maximumTextureSize: 512,
                    },
                }),
                audio(),
                pixiManifest({
                    createShortcuts: true,
                    trimExtensions: false,
                    includeMetaData: false,
                }),
                spineAtlasManifestMod(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`)) as any;

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['spine/dragon.atlas', 'dragon.atlas'],
                    src: ['spine/dragon.atlas'],
                },
            ],
        });
    });

    it('should not trim extensions in manifest names', async () => {
        const testName = 'manifest-shortcut-no-trim';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'folder',
                    files: [
                        {
                            name: 'json.json',
                            content: assetPath('json/json.json'),
                        },
                        {
                            name: 'json.json5',
                            content: assetPath('json/json.json'),
                        },
                        {
                            name: 'sprite.png',
                            content: assetPath('image/sp-1.png'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'folder2',
                    files: [
                        {
                            name: '1.mp3',
                            content: assetPath('audio/1.mp3'),
                        },
                    ],
                    folders: [
                        {
                            name: 'folder3',
                            files: [
                                {
                                    name: '1.mp3',
                                    content: assetPath('audio/1.mp3'),
                                },
                            ],
                            folders: [],
                        },
                    ],
                },
                {
                    name: 'spine',
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
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            cache: false,
            output: outputDir,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                }),
                audio(),
                mipmap(),
                spineAtlasMipmap(),
                compress({
                    webp: true,
                    png: true,
                    astc: true,
                }),
                pixiManifest({
                    createShortcuts: true,
                    trimExtensions: false,
                    includeMetaData: false,
                }),
                spineAtlasManifestMod(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`)) as any;

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['folder/json.json', 'json.json'],
                    src: ['folder/json.json'],
                },
                {
                    alias: ['folder/json.json5', 'json.json5'],
                    src: ['folder/json.json5'],
                },
                {
                    alias: ['folder/sprite.png', 'sprite.png'],
                    src: [
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@0.5x.png',
                        'folder/sprite@0.5x.astc.ktx',
                        'folder/sprite.webp',
                        'folder/sprite.png',
                        'folder/sprite.astc.ktx',
                    ],
                },
                {
                    alias: ['folder2/1.mp3'],
                    src: ['folder2/1.ogg', 'folder2/1.mp3'],
                },
                {
                    alias: ['folder2/folder3/1.mp3'],
                    src: ['folder2/folder3/1.ogg', 'folder2/folder3/1.mp3'],
                },
                {
                    alias: ['spine/dragon.json', 'dragon.json'],
                    src: ['spine/dragon.json'],
                },
                {
                    alias: ['spine/dragon.atlas', 'dragon.atlas'],
                    src: ['spine/dragon@0.5x.atlas', 'spine/dragon.atlas'],
                },
            ],
        });
    });

    it('should not remove base path in manifest names', async () => {
        const testName = 'manifest-shortcut-no-base';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'folder',
                    files: [
                        {
                            name: 'json.json',
                            content: assetPath('json/json.json'),
                        },
                        {
                            name: 'json.json5',
                            content: assetPath('json/json.json'),
                        },
                        {
                            name: 'sprite.png',
                            content: assetPath('image/sp-1.png'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'folder2',
                    files: [
                        {
                            name: '1.mp3',
                            content: assetPath('audio/1.mp3'),
                        },
                    ],
                    folders: [
                        {
                            name: 'folder3',
                            files: [
                                {
                                    name: '1.mp3',
                                    content: assetPath('audio/1.mp3'),
                                },
                            ],
                            folders: [],
                        },
                    ],
                },
                {
                    name: 'spine',
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
                        maximumTextureSize: 512,
                    },
                }),
                audio(),
                spineAtlasMipmap(),
                mipmap(),
                compress({
                    webp: true,
                    png: true,
                    astc: true,
                }),
                pixiManifest({
                    createShortcuts: false,
                    trimExtensions: true,
                    includeMetaData: false,
                }),
                spineAtlasManifestMod(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`)) as any;

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['folder/json.json'],
                    src: ['folder/json.json'],
                },
                {
                    alias: ['folder/json.json5'],
                    src: ['folder/json.json5'],
                },
                {
                    alias: ['folder/sprite.png', 'folder/sprite'],
                    src: [
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@0.5x.png',
                        'folder/sprite@0.5x.astc.ktx',
                        'folder/sprite.webp',
                        'folder/sprite.png',
                        'folder/sprite.astc.ktx',
                    ],
                },
                {
                    alias: ['folder2/1.mp3', 'folder2/1'],
                    src: ['folder2/1.ogg', 'folder2/1.mp3'],
                },
                {
                    alias: ['folder2/folder3/1.mp3', 'folder2/folder3/1'],
                    src: ['folder2/folder3/1.ogg', 'folder2/folder3/1.mp3'],
                },
                {
                    alias: ['spine/dragon.json'],
                    src: ['spine/dragon.json'],
                },
                {
                    alias: ['spine/dragon.atlas'],
                    src: ['spine/dragon@0.5x.atlas', 'spine/dragon.atlas'],
                },
            ],
        });
    });

    it('should use the correct output path', async () => {
        const testName = 'manifest-output';
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
                            name: '1.mp3',
                            content: assetPath('audio/1.mp3'),
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
                pixiManifest({
                    output: `${outputDir}/manifest2.json`,
                }),
            ],
        });

        await assetpack.run();

        // load the manifest json
        expect(existsSync(`${outputDir}/manifest.json`)).toBe(false);
        expect(existsSync(`${outputDir}/manifest2.json`)).toBe(true);
    });

    it('should ensure sub-manifests are created correctly', async () => {
        const testName = 'manifest-sub-manifest';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'sound{m}',
                    files: [
                        {
                            name: '1.mp3',
                            content: assetPath('audio/1.mp3'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'sound2{m}',
                    files: [
                        {
                            name: '2.mp3',
                            content: assetPath('audio/1.mp3'),
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
                pixiManifest({
                    includeMetaData: false,
                }),
            ],
        });

        await assetpack.run();

        expect(fs.readJSONSync(`${outputDir}/manifest.json`)).toEqual({
            bundles: [
                {
                    name: 'default',
                    assets: [],
                },
                {
                    name: 'sound2',
                    assets: [
                        {
                            alias: ['sound2/2.mp3'],
                            src: ['sound2/2.mp3'],
                        },
                    ],
                },
                {
                    name: 'sound',
                    assets: [
                        {
                            alias: ['sound/1.mp3'],
                            src: ['sound/1.mp3'],
                        },
                    ],
                },
            ],
        });
    });

    it('should ensure sub-manifests are created correctly with short names', async () => {
        const testName = 'manifest-sub-manifest-short';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'sound{m}',
                    files: [
                        {
                            name: '1.mp3',
                            content: assetPath('audio/1.mp3'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'sound2{m}',
                    files: [
                        {
                            name: '2.mp3',
                            content: assetPath('audio/1.mp3'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'sound3{m}',
                    files: [
                        {
                            name: '3.mp3',
                            content: assetPath('audio/1.mp3'),
                        },
                    ],
                    folders: [
                        {
                            name: 'sound2{m}',
                            files: [
                                {
                                    name: '2.mp3',
                                    content: assetPath('audio/1.mp3'),
                                },
                            ],
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
            pipes: [
                pixiManifest({
                    includeMetaData: false,
                }),
            ],
        });

        await assetpack.run();

        expect(fs.readJSONSync(`${outputDir}/manifest.json`)).toEqual({
            bundles: [
                {
                    name: 'default',
                    assets: [],
                },
                {
                    name: 'sound2',
                    assets: [
                        {
                            alias: ['sound2/2.mp3'],
                            src: ['sound2/2.mp3'],
                        },
                    ],
                },
                {
                    name: 'sound3',
                    assets: [
                        {
                            alias: ['sound3/3.mp3'],
                            src: ['sound3/3.mp3'],
                        },
                    ],
                },
                {
                    name: 'sound3/sound2',
                    assets: [
                        {
                            alias: ['sound3/sound2/2.mp3'],
                            src: ['sound3/sound2/2.mp3'],
                        },
                    ],
                },
                {
                    name: 'sound',
                    assets: [
                        {
                            alias: ['sound/1.mp3'],
                            src: ['sound/1.mp3'],
                        },
                    ],
                },
            ],
        });
    });

    it('should ensure sub-manifests are created correctly with relative names', async () => {
        const testName = 'manifest-sub-manifest-relative';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'sound{m}',
                    files: [
                        {
                            name: '1.mp3',
                            content: assetPath('audio/1.mp3'),
                        },
                    ],
                    folders: [
                        {
                            name: 'sound2{m}',
                            files: [
                                {
                                    name: '2.mp3',
                                    content: assetPath('audio/1.mp3'),
                                },
                            ],
                            folders: [],
                        },
                    ],
                },
                {
                    name: 'sound3{m}',
                    files: [
                        {
                            name: '3.mp3',
                            content: assetPath('audio/1.mp3'),
                        },
                    ],
                    folders: [
                        {
                            name: 'sound2{m}',
                            files: [
                                {
                                    name: '2.mp3',
                                    content: assetPath('audio/1.mp3'),
                                },
                            ],
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
            pipes: [
                pixiManifest({
                    includeMetaData: false,
                    nameStyle: 'relative',
                }),
            ],
        });

        await assetpack.run();

        expect(fs.readJSONSync(`${outputDir}/manifest.json`)).toEqual({
            bundles: [
                {
                    name: 'default',
                    assets: [],
                },
                {
                    name: 'sound3',
                    assets: [
                        {
                            alias: ['sound3/3.mp3'],
                            src: ['sound3/3.mp3'],
                        },
                    ],
                },
                {
                    name: 'sound3/sound2',
                    assets: [
                        {
                            alias: ['sound3/sound2/2.mp3'],
                            src: ['sound3/sound2/2.mp3'],
                        },
                    ],
                },
                {
                    name: 'sound',
                    assets: [
                        {
                            alias: ['sound/1.mp3'],
                            src: ['sound/1.mp3'],
                        },
                    ],
                },
                {
                    name: 'sound/sound2',
                    assets: [
                        {
                            alias: ['sound/sound2/2.mp3'],
                            src: ['sound/sound2/2.mp3'],
                        },
                    ],
                },
            ],
        });
    });

    it('should ignore files with the mIgnore tag', async () => {
        const testName = 'manifest-ignore';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [
                {
                    name: '1.png',
                    content: assetPath('image/sp-1.png'),
                },
                {
                    name: '2{mIgnore}.png',
                    content: assetPath('image/sp-1.png'),
                },
            ],
            folders: [],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                pixiManifest({
                    includeMetaData: false,
                }),
            ],
        });

        await assetpack.run();

        const manifest = sortObjectProperties(await fs.readJSONSync(`${outputDir}/manifest.json`));

        expect(manifest).toEqual({
            bundles: [
                {
                    name: 'default',
                    assets: [
                        {
                            alias: ['1.png'],
                            src: ['1.png'],
                        },
                    ],
                },
            ],
        });
    });
});

function sortObjectProperties(obj: any) {
    return Object.keys(obj)
        .sort()
        .reduce((acc: any, key: string) => {
            const value = obj[key];

            if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                acc[key] = sortObjectProperties(value);
            } else {
                if (Array.isArray(value)) {
                    value.sort();
                }

                acc[key] = value;
            }

            return acc;
        }, {});
}
