import { AssetPack } from '@assetpack/core';
import { audio } from '@assetpack/plugin-ffmpeg';
import { pixiManifest } from '@assetpack/plugin-manifest';
import { mipmap, spineAtlasMipmap } from '@assetpack/plugin-mipmap';
import { pixiTexturePacker } from '@assetpack/plugin-texture-packer';
import { compressWebp } from '@assetpack/plugin-compress';
// import { webfont } from '@assetpack/plugin-webfont';
import { existsSync, readJSONSync } from 'fs-extra';
import type { File } from '../../../shared/test';
import {
    assetPath,
    createFolder,
    getInputDir,
    getOutputDir,
} from '../../../shared/test';

const pkg = 'manifest';

function genSprites()
{
    const sprites: File[] = [];

    for (let i = 0; i < 10; i++)
    {
        sprites.push({
            name: `sprite${i}.png`,
            content: assetPath(pkg, `tps/sp-${i + 1}.png`),
        });
    }

    return sprites;
}

describe('Manifest', () =>
{
    it('should gather all transformed spritesheet files even if split into multiple files', async () =>
    {
        const testName = 'manifest-spritesheet';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'bundle{m}',
                    files: [
                        {
                            name: 'json.json',
                            content: assetPath(pkg, 'json.json'),
                        },
                        {
                            name: 'json.json5',
                            content: assetPath(pkg, 'json.json'),
                        },
                        {
                            name: 'sprite.png',
                            content: assetPath(pkg, 'tps/sp-1.png'),
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
                            content: assetPath(pkg, 'audio/1.mp3'),
                        },
                        {
                            name: '3.wav',
                            content: assetPath(pkg, 'audio/3.wav'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'spine',
                    files: [
                        {
                            name: 'dragon{spine}.atlas',
                            content: assetPath(pkg, 'spine/dragon.atlas'),
                        },
                        {
                            name: 'dragon.json',
                            content: assetPath(pkg, 'spine/dragon.json'),
                        },
                        {
                            name: 'dragon.png',
                            content: assetPath(pkg, 'spine/dragon.png'),
                        },
                        {
                            name: 'dragon2.png',
                            content: assetPath(pkg, 'spine/dragon2.png'),
                        },
                    ],
                    folders: [],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                texturePacker: pixiTexturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                }),
                audio: audio(),
                mipmap: mipmap(),
                spineAtlas: spineAtlasMipmap(),
                manifest: pixiManifest(),
                webp: compressWebp(),
            },
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

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
                        'bundle/sprite@1x.png',
                        'bundle/sprite@0.5x.png',
                        'bundle/sprite@0.5x.webp',
                        'bundle/sprite@1x.webp',
                    ],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/tps/tps-1.json'],
                    src: [
                        'bundle/tps/tps-1@1x.json',
                        'bundle/tps/tps-1@0.5x.json',
                    ],
                    data: {
                        tags: {
                            tps: true,
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/tps/tps-0.json'],
                    src: [
                        'bundle/tps/tps-0@1x.json',
                        'bundle/tps/tps-0@0.5x.json',
                    ],
                    data: {
                        tags: {
                            tps: true,
                            m: true,
                        },
                    },
                },
            ],
        });
        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: ['defaultFolder/1.mp3'],
                    src: ['defaultFolder/1.mp3', 'defaultFolder/1.ogg'],
                },
                {
                    alias: ['defaultFolder/3.wav'],
                    src: ['defaultFolder/3.mp3', 'defaultFolder/3.ogg'],
                },
                {
                    alias: ['spine/dragon.json'],
                    src: ['spine/dragon.json'],
                },
                {
                    alias: ['spine/dragon.png'],
                    src: ['spine/dragon@1x.png', 'spine/dragon@0.5x.png', 'spine/dragon@0.5x.webp', 'spine/dragon@1x.webp'],
                },
                {
                    alias: ['spine/dragon2.png'],
                    src: [
                        'spine/dragon2@1x.png',
                        'spine/dragon2@0.5x.png',
                        'spine/dragon2@0.5x.webp',
                        'spine/dragon2@1x.webp',
                    ],
                },
                {
                    alias: ['spine/dragon.atlas'],
                    src: ['spine/dragon@1x.atlas', 'spine/dragon@0.5x.atlas'],
                    data: {
                        tags: {
                            spine: true,
                        },
                    },
                },
            ],
        });
    });

    it('should try to add a shortcut to the names of each entry', async () =>
    {
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
                            content: assetPath(pkg, 'json.json'),
                        },
                        {
                            name: 'json.json5',
                            content: assetPath(pkg, 'json.json'),
                        },
                        {
                            name: 'sprite.png',
                            content: assetPath(pkg, 'tps/sp-1.png'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'folder2',
                    files: [
                        {
                            name: '1.mp3',
                            content: assetPath(pkg, 'audio/1.mp3'),
                        },
                    ],
                    folders: [
                        {
                            name: 'folder3',
                            files: [
                                {
                                    name: '1.mp3',
                                    content: assetPath(pkg, 'audio/1.mp3'),
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
                            content: assetPath(pkg, 'spine/dragon.atlas'),
                        },
                        {
                            name: 'dragon.json',
                            content: assetPath(pkg, 'spine/dragon.json'),
                        },
                        {
                            name: 'dragon.png',
                            content: assetPath(pkg, 'spine/dragon.png'),
                        },
                        {
                            name: 'dragon2.png',
                            content: assetPath(pkg, 'spine/dragon2.png'),
                        },
                    ],
                    folders: [],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                texturePacker: pixiTexturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                }),
                audio: audio(),
                mipmap: mipmap(),
                spineAtlas: spineAtlasMipmap(),
                manifest: pixiManifest({
                    createShortcuts: true,
                    trimExtensions: true,
                }),
                webp: compressWebp(),
            },
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

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
                    alias: [
                        'folder/sprite.png',
                        'folder/sprite',
                        'sprite.png',
                        'sprite',
                    ],
                    src: [
                        'folder/sprite@1x.png',
                        'folder/sprite@0.5x.png',
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@1x.webp',
                    ],
                },
                {
                    alias: ['folder2/1.mp3', 'folder2/1'],
                    src: ['folder2/1.mp3', 'folder2/1.ogg'],
                },
                {
                    alias: ['folder2/folder3/1.mp3', 'folder2/folder3/1'],
                    src: ['folder2/folder3/1.mp3', 'folder2/folder3/1.ogg'],
                },
                {
                    alias: ['spine/dragon.json', 'dragon.json'],
                    src: ['spine/dragon.json'],
                },
                {
                    alias: ['spine/dragon.png', 'dragon.png'],
                    src: ['spine/dragon@1x.png', 'spine/dragon@0.5x.png', 'spine/dragon@0.5x.webp', 'spine/dragon@1x.webp'],
                },
                {
                    alias: [
                        'spine/dragon2.png',
                        'spine/dragon2',
                        'dragon2.png',
                        'dragon2',
                    ],
                    src: [
                        'spine/dragon2@1x.png',
                        'spine/dragon2@0.5x.png',
                        'spine/dragon2@0.5x.webp',
                        'spine/dragon2@1x.webp',
                    ],
                },
                {
                    alias: ['spine/dragon.atlas', 'dragon.atlas'],
                    src: ['spine/dragon@1x.atlas', 'spine/dragon@0.5x.atlas'],
                    data: {
                        tags: {
                            spine: true,
                        },
                    },
                },
            ],
        });
    });

    it('should not trim extensions in manifest names', async () =>
    {
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
                            content: assetPath(pkg, 'json.json'),
                        },
                        {
                            name: 'json.json5',
                            content: assetPath(pkg, 'json.json'),
                        },
                        {
                            name: 'sprite.png',
                            content: assetPath(pkg, 'tps/sp-1.png'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'folder2',
                    files: [
                        {
                            name: '1.mp3',
                            content: assetPath(pkg, 'audio/1.mp3'),
                        },
                    ],
                    folders: [
                        {
                            name: 'folder3',
                            files: [
                                {
                                    name: '1.mp3',
                                    content: assetPath(pkg, 'audio/1.mp3'),
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
                            content: assetPath(pkg, 'spine/dragon.atlas'),
                        },
                        {
                            name: 'dragon.json',
                            content: assetPath(pkg, 'spine/dragon.json'),
                        },
                        {
                            name: 'dragon.png',
                            content: assetPath(pkg, 'spine/dragon.png'),
                        },
                        {
                            name: 'dragon2.png',
                            content: assetPath(pkg, 'spine/dragon2.png'),
                        },
                    ],
                    folders: [],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                texturePacker: pixiTexturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                }),
                audio: audio(),
                mipmap: mipmap(),
                spineAtlas: spineAtlasMipmap(),
                manifest: pixiManifest({
                    createShortcuts: true,
                    trimExtensions: false,
                }),
                webp: compressWebp(),
            },
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

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
                        'folder/sprite@1x.png',
                        'folder/sprite@0.5x.png',
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@1x.webp',
                    ],
                },
                {
                    alias: ['folder2/1.mp3'],
                    src: ['folder2/1.mp3', 'folder2/1.ogg'],
                },
                {
                    alias: ['folder2/folder3/1.mp3'],
                    src: ['folder2/folder3/1.mp3', 'folder2/folder3/1.ogg'],
                },
                {
                    alias: ['spine/dragon.json', 'dragon.json'],
                    src: ['spine/dragon.json'],
                },
                {
                    alias: ['spine/dragon.png', 'dragon.png'],
                    src: ['spine/dragon@1x.png', 'spine/dragon@0.5x.png', 'spine/dragon@0.5x.webp', 'spine/dragon@1x.webp'],
                },
                {
                    alias: ['spine/dragon2.png', 'dragon2.png'],
                    src: [
                        'spine/dragon2@1x.png',
                        'spine/dragon2@0.5x.png',
                        'spine/dragon2@0.5x.webp',
                        'spine/dragon2@1x.webp',
                    ],
                },
                {
                    alias: ['spine/dragon.atlas', 'dragon.atlas'],
                    src: ['spine/dragon@1x.atlas', 'spine/dragon@0.5x.atlas'],
                    data: {
                        tags: {
                            spine: true,
                        },
                    },
                },
            ],
        });
    });

    it('should not remove base path in manifest names', async () =>
    {
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
                            content: assetPath(pkg, 'json.json'),
                        },
                        {
                            name: 'json.json5',
                            content: assetPath(pkg, 'json.json'),
                        },
                        {
                            name: 'sprite.png',
                            content: assetPath(pkg, 'tps/sp-1.png'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'folder2',
                    files: [
                        {
                            name: '1.mp3',
                            content: assetPath(pkg, 'audio/1.mp3'),
                        },
                    ],
                    folders: [
                        {
                            name: 'folder3',
                            files: [
                                {
                                    name: '1.mp3',
                                    content: assetPath(pkg, 'audio/1.mp3'),
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
                            content: assetPath(pkg, 'spine/dragon.atlas'),
                        },
                        {
                            name: 'dragon.json',
                            content: assetPath(pkg, 'spine/dragon.json'),
                        },
                        {
                            name: 'dragon.png',
                            content: assetPath(pkg, 'spine/dragon.png'),
                        },
                        {
                            name: 'dragon2.png',
                            content: assetPath(pkg, 'spine/dragon2.png'),
                        },
                    ],
                    folders: [],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                texturePacker: pixiTexturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                }),
                audio: audio(),
                mipmap: mipmap(),
                spineAtlas: spineAtlasMipmap(),
                manifest: pixiManifest({
                    createShortcuts: false,
                    trimExtensions: true,
                }),
                webp: compressWebp(),
            },
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

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
                    alias: [
                        'folder/sprite.png',
                        'folder/sprite',
                    ],
                    src: [
                        'folder/sprite@1x.png',
                        'folder/sprite@0.5x.png',
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@1x.webp',
                    ],
                },
                {
                    alias: ['folder2/1.mp3', 'folder2/1'],
                    src: ['folder2/1.mp3', 'folder2/1.ogg'],
                },
                {
                    alias: ['folder2/folder3/1.mp3', 'folder2/folder3/1'],
                    src: ['folder2/folder3/1.mp3', 'folder2/folder3/1.ogg'],
                },
                {
                    alias: ['spine/dragon.json'],
                    src: ['spine/dragon.json'],
                },
                {
                    alias: ['spine/dragon.png'],
                    src: ['spine/dragon@1x.png', 'spine/dragon@0.5x.png', 'spine/dragon@0.5x.webp', 'spine/dragon@1x.webp'],
                },
                {
                    alias: [
                        'spine/dragon2.png',
                        'spine/dragon2',
                    ],
                    src: [
                        'spine/dragon2@1x.png',
                        'spine/dragon2@0.5x.png',
                        'spine/dragon2@0.5x.webp',
                        'spine/dragon2@1x.webp',
                    ],
                },
                {
                    alias: ['spine/dragon.atlas'],
                    src: ['spine/dragon@1x.atlas', 'spine/dragon@0.5x.atlas'],
                    data: {
                        tags: {
                            spine: true,
                        },
                    },
                },
            ],
        });
    });

    it('should use the correct output path', async () =>
    {
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
                            content: assetPath(pkg, 'audio/1.mp3'),
                        },
                    ],
                    folders: [],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                manifest: pixiManifest({
                    output: `${outputDir}/manifest2.json`,
                }),
            },
        });

        await assetpack.run();

        // load the manifest json
        expect(existsSync(`${outputDir}/manifest.json`)).toBe(false);
        expect(existsSync(`${outputDir}/manifest2.json`)).toBe(true);
    });
});
