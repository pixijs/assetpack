import { AssetPack, SavableAssetCache } from '@assetpack/core';
import { pixiManifest } from '@assetpack/manifest';
import { pixiTexturePacker, pixiTexturePackerParser } from '@assetpack/texture-packer';
import { readJSONSync } from 'fs-extra';
import type { File } from '../../../shared/test';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';

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

        createFolder(
            pkg,
            {
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
                        ],
                        folders: [
                            {
                                name: 'tps{tps}',
                                files: genSprites(),
                                folders: [],
                            }
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
                                name: '2.mp3',
                                content: assetPath(pkg, 'audio/2.mp3'),
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
                    }
                }),
                manifest: pixiManifest({
                    parsers: [
                        pixiTexturePackerParser
                    ]
                }),
            }
        });

        await assetpack.run();

        expect(SavableAssetCache['cache'].size).toBe(5);

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[1]).toEqual({
            name: 'bundle',
            assets: [
                {
                    name: 'bundle/json.json',
                    srcs: [
                        'bundle/json.{json}',
                    ],
                    data: {
                        tags: {
                            m: true
                        }
                    }
                },
                {
                    name: 'bundle/json.json5',
                    srcs: [
                        'bundle/json.{json5}',
                    ],
                    data: {
                        tags: {
                            m: true
                        }
                    }
                },
                {
                    name: 'bundle/tps/tps-1.json',
                    srcs: [
                        'bundle/tps/tps-1@{1,0.5}x.{json}',
                    ],
                    data: {
                        tags: {
                            tps: true,
                            m: true
                        },
                    },
                },
                {
                    name: 'bundle/tps/tps-0.json',
                    srcs: [
                        'bundle/tps/tps-0@{1,0.5}x.{json}',
                    ],
                    data: {
                        tags: {
                            tps: true,
                            m: true
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
                    srcs: [
                        'defaultFolder/1.{mp3}',
                    ],
                },
                {
                    name: 'defaultFolder/2.mp3',
                    srcs: [
                        'defaultFolder/2.{mp3}',
                    ],
                },
            ],
        });
    });
});
