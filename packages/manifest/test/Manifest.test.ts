import { AssetPack } from '@assetpack/core';
import { audio } from '@assetpack/plugin-ffmpeg';
import { pixiManifest } from '@assetpack/plugin-manifest';
import { mipmapCompress, spineAtlasMipmap } from '@assetpack/plugin-mipmap-compress';
import { texturePacker } from '@assetpack/plugin-texture-packer';
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

        const useCache = false;

        if (!useCache)
        {
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
        }

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: useCache,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                }),
                audio(),
                spineAtlasMipmap(),
                mipmapCompress({
                    compress: {
                        png: true,
                        jpg: true,
                        webp: true,
                        avif: false,
                    }
                }),
                pixiManifest(),
            ]
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[1]).toEqual({
            name: 'bundle',
            assets: [
                {
                    name: ['bundle/json.json'],
                    srcs: ['bundle/json.json'],
                },
                {
                    name: ['bundle/json.json5'],
                    srcs: ['bundle/json.json5'],
                },
                {
                    name: ['bundle/sprite.png'],
                    srcs: [
                        'bundle/sprite.webp',
                        'bundle/sprite.png',
                        'bundle/sprite@0.5x.webp',
                        'bundle/sprite@0.5x.png',
                    ],
                    // data: {
                    //     tags: {
                    //         m: true,
                    //     },
                    // },
                },
                {
                    name: ['bundle/tps-0'],
                    srcs: [
                        'bundle/tps-0.json',
                        'bundle/tps-0@0.5x.json',
                    ],
                    // data: {
                    //     tags: {
                    //         tps: true,
                    //         m: true,
                    //     },
                    // },
                },
                {
                    name: ['bundle/tps-1'],
                    srcs: [
                        'bundle/tps-1.json',
                        'bundle/tps-1@0.5x.json',
                    ],
                    // data: {
                    //     tags: {
                    //         tps: true,
                    //         m: true,
                    //     },
                    // },
                },
            ],
        });
        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    name: ['defaultFolder/1.mp3'],
                    srcs: ['defaultFolder/1.mp3', 'defaultFolder/1.ogg'],
                },
                {
                    name: ['defaultFolder/3.wav'],
                    srcs: ['defaultFolder/3.mp3', 'defaultFolder/3.ogg'],
                },
                {
                    name: ['spine/dragon.json'],
                    srcs: ['spine/dragon.json'],
                },
                {
                    name: ['spine/dragon.png'],
                    srcs: [
                        'spine/dragon.webp',
                        'spine/dragon.png',
                        'spine/dragon@0.5x.webp',
                        'spine/dragon@0.5x.png',
                    ],
                },
                {
                    name: ['spine/dragon2.png'],
                    srcs: [
                        'spine/dragon2.webp',
                        'spine/dragon2.png',
                        'spine/dragon2@0.5x.webp',
                        'spine/dragon2@0.5x.png',
                    ],
                },
                {
                    name: ['spine/dragon.atlas'],
                    srcs: [
                        'spine/dragon.atlas',
                        'spine/dragon@0.5x.atlas',
                    ],
                    // data: {
                    //     tags: {
                    //         spine: true,
                    //     },
                    // },
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
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                }),
                audio(),
                spineAtlasMipmap(),
                mipmapCompress({
                    compress: {
                        webp: true,
                        png: true,
                    }
                }),
                pixiManifest({
                    createShortcuts: true,
                    trimExtensions: true,
                }),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    name: [
                        'folder/json.json',
                        'folder/json',
                        'json.json',
                        'json'
                    ],
                    srcs: [
                        'folder/json.json'
                    ]
                },
                {
                    name: [
                        'folder/json.json5',
                        'folder/json',
                        'json.json5',
                        'json'
                    ],
                    srcs: [
                        'folder/json.json5'
                    ]
                },
                {
                    name: [
                        'folder/sprite.png',
                        'folder/sprite',
                        'sprite.png',
                        'sprite'
                    ],
                    srcs: [
                        'folder/sprite.webp',
                        'folder/sprite.png',
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@0.5x.png'
                    ]
                },
                {
                    name: [
                        'folder2/1.mp3',
                        'folder2/1',
                        '1.mp3',
                        '1'
                    ],
                    srcs: [
                        'folder2/1.mp3',
                        'folder2/1.ogg'
                    ]
                },
                {
                    name: [
                        'folder2/folder3/1.mp3',
                        'folder2/folder3/1',
                        '1.mp3',
                        '1'
                    ],
                    srcs: [
                        'folder2/folder3/1.mp3',
                        'folder2/folder3/1.ogg'
                    ]
                },
                {
                    name: [
                        'spine/dragon.json',
                        'spine/dragon',
                        'dragon.json',
                        'dragon'
                    ],
                    srcs: [
                        'spine/dragon.json'
                    ]
                },
                {
                    name: [
                        'spine/dragon.png',
                        'spine/dragon',
                        'dragon.png',
                        'dragon'
                    ],
                    srcs: [
                        'spine/dragon.webp',
                        'spine/dragon.png',
                        'spine/dragon@0.5x.webp',
                        'spine/dragon@0.5x.png'
                    ]
                },
                {
                    name: [
                        'spine/dragon2.png',
                        'spine/dragon2',
                        'dragon2.png',
                        'dragon2'
                    ],
                    srcs: [
                        'spine/dragon2.webp',
                        'spine/dragon2.png',
                        'spine/dragon2@0.5x.webp',
                        'spine/dragon2@0.5x.png'
                    ]
                },
                {
                    name: [
                        'spine/dragon.atlas',
                        'spine/dragon',
                        'dragon.atlas',
                        'dragon'
                    ],
                    srcs: [
                        'spine/dragon.atlas',
                        'spine/dragon@0.5x.atlas'
                    ]
                }
            ]
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
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                }),
                audio(),
                spineAtlasMipmap(),
                mipmapCompress({
                    compress: {
                        webp: true,
                        png: true,
                    }
                }),
                pixiManifest({
                    createShortcuts: true,
                    trimExtensions: false,
                }),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    name: ['folder/json.json', 'json.json'],
                    srcs: ['folder/json.json'],
                },
                {
                    name: ['folder/json.json5', 'json.json5'],
                    srcs: ['folder/json.json5'],
                },
                {
                    name: ['folder/sprite.png', 'sprite.png'],
                    srcs: [
                        'folder/sprite.webp',
                        'folder/sprite.png',
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@0.5x.png'
                    ],
                },
                {
                    name: ['folder2/1.mp3', '1.mp3'],
                    srcs: ['folder2/1.mp3', 'folder2/1.ogg'],
                },
                {
                    name: ['folder2/folder3/1.mp3', '1.mp3'],
                    srcs: ['folder2/folder3/1.mp3', 'folder2/folder3/1.ogg'],
                },
                {
                    name: ['spine/dragon.json', 'dragon.json'],
                    srcs: ['spine/dragon.json'],
                },
                {
                    name: ['spine/dragon.png', 'dragon.png'],
                    srcs: [
                        'spine/dragon.webp',
                        'spine/dragon.png',
                        'spine/dragon@0.5x.webp',
                        'spine/dragon@0.5x.png'
                    ],
                },
                {
                    name: ['spine/dragon2.png', 'dragon2.png'],
                    srcs: [
                        'spine/dragon2.webp',
                        'spine/dragon2.png',
                        'spine/dragon2@0.5x.webp',
                        'spine/dragon2@0.5x.png'
                    ],
                },
                {
                    name: ['spine/dragon.atlas', 'dragon.atlas'],
                    srcs: ['spine/dragon.atlas', 'spine/dragon@0.5x.atlas'],
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
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        maximumTextureSize: 512,
                    },
                }),
                audio(),
                spineAtlasMipmap(),
                mipmapCompress({
                    compress: {
                        webp: true,
                        png: true,
                    }
                }),
                pixiManifest({
                    createShortcuts: false,
                    trimExtensions: true,
                }),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    name: [
                        'folder/json.json',
                        'folder/json'
                    ],
                    srcs: [
                        'folder/json.json'
                    ]
                },
                {
                    name: [
                        'folder/json.json5',
                        'folder/json'
                    ],
                    srcs: [
                        'folder/json.json5'
                    ]
                },
                {
                    name: [
                        'folder/sprite.png',
                        'folder/sprite'
                    ],
                    srcs: [
                        'folder/sprite.webp',
                        'folder/sprite.png',
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@0.5x.png'
                    ]
                },
                {
                    name: [
                        'folder2/1.mp3',
                        'folder2/1'
                    ],
                    srcs: [
                        'folder2/1.mp3',
                        'folder2/1.ogg'
                    ]
                },
                {
                    name: [
                        'folder2/folder3/1.mp3',
                        'folder2/folder3/1'
                    ],
                    srcs: [
                        'folder2/folder3/1.mp3',
                        'folder2/folder3/1.ogg'
                    ]
                },
                {
                    name: [
                        'spine/dragon.json',
                        'spine/dragon'
                    ],
                    srcs: [
                        'spine/dragon.json'
                    ]
                },
                {
                    name: [
                        'spine/dragon.png',
                        'spine/dragon'
                    ],
                    srcs: [
                        'spine/dragon.webp',
                        'spine/dragon.png',
                        'spine/dragon@0.5x.webp',
                        'spine/dragon@0.5x.png'
                    ]
                },
                {
                    name: [
                        'spine/dragon2.png',
                        'spine/dragon2'
                    ],
                    srcs: [
                        'spine/dragon2.webp',
                        'spine/dragon2.png',
                        'spine/dragon2@0.5x.webp',
                        'spine/dragon2@0.5x.png'
                    ]
                },
                {
                    name: [
                        'spine/dragon.atlas',
                        'spine/dragon'
                    ],
                    srcs: [
                        'spine/dragon.atlas',
                        'spine/dragon@0.5x.atlas'
                    ]
                }
            ]

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
});
