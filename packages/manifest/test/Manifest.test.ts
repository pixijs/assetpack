import { AssetPack } from '@assetpack/core';
import { audio, pixiManifestAudio } from '@assetpack/plugin-ffmpeg';
import { pixiManifest } from '@assetpack/plugin-manifest';
import { mipmap, spineAtlasMipmap } from '@assetpack/plugin-mipmap';
import { pixiTexturePacker } from '@assetpack/plugin-texture-packer';
// import { webfont } from '@assetpack/plugin-webfont';
import { readJSONSync } from 'fs-extra';
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
                // webfont: webfont(), // import is breaking definition file
                manifest: pixiManifest({
                    parsers: [pixiManifestAudio],
                }),
            },
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[1]).toEqual({
            name: 'bundle',
            assets: [
                {
                    name: 'bundle/json.json',
                    srcs: ['bundle/json.{json}'],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    name: 'bundle/json.json5',
                    srcs: ['bundle/json.{json5}'],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    name: 'bundle/sprite.png',
                    srcs: ['bundle/sprite@{1,0.5}x.{png}'],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    name: 'bundle/tps/tps-1.json',
                    srcs: ['bundle/tps/tps-1@{1,0.5}x.{json}'],
                    data: {
                        tags: {
                            tps: true,
                            m: true,
                        },
                    },
                },
                {
                    name: 'bundle/tps/tps-0.json',
                    srcs: ['bundle/tps/tps-0@{1,0.5}x.{json}'],
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
                    name: 'defaultFolder/1.mp3',
                    srcs: ['defaultFolder/1.{ogg,mp3}'],
                },
                {
                    name: 'defaultFolder/3.wav',
                    srcs: ['defaultFolder/3.{ogg,mp3}'],
                },
                {
                    name: 'spine/dragon.json',
                    srcs: ['spine/dragon.{json}'],
                },
                {
                    name: 'spine/dragon.png',
                    srcs: ['spine/dragon@{1,0.5}x.{png}'],
                },
                {
                    name: 'spine/dragon2.png',
                    srcs: ['spine/dragon2@{1,0.5}x.{png}'],
                },
                {
                    name: 'spine/dragon.atlas',
                    srcs: ['spine/dragon@{1,0.5}x.{atlas}'],
                    data: {
                        tags: {
                            spine: true,
                        },
                    },
                },
            ],
        });
    });
});
