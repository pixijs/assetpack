import { AssetPack } from '@play-co/assetpack-core';
import { audio } from '@play-co/assetpack-plugin-ffmpeg';
import { compress, mipmap } from '@play-co/assetpack-plugin-image';
import { pixiManifest } from '@play-co/assetpack-plugin-manifest';
import { spineAtlasManifestMod, spineAtlasMipmap } from '@play-co/assetpack-plugin-spine';
import { texturePacker, texturePackerManifestMod } from '@play-co/assetpack-plugin-texture-packer';
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
                mipmap(),
                compress({
                    png: true,
                    jpg: true,
                    webp: true,
                    avif: false,
                }),
                pixiManifest(),
                spineAtlasManifestMod(),
                texturePackerManifestMod(),
            ]
        });

        await assetpack.run();

        // load the manifest json
        const manifest =  sortObjectProperties((await readJSONSync(`${outputDir}/manifest.json`))) as any;

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
                        'bundle/sprite.webp',
                        'bundle/sprite.png',
                    ],
                    data: {
                        tags: {
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/tps-0'],
                    src: [
                        'bundle/tps-0@0.5x.json',
                        'bundle/tps-0.json',
                    ],
                    data: {
                        tags: {
                            tps: true,
                            m: true,
                        },
                    },
                },
                {
                    alias: ['bundle/tps-1'],
                    src: [
                        'bundle/tps-1@0.5x.json',
                        'bundle/tps-1.json',
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
                        tags: {}
                    },
                },
                {
                    alias: ['spine/dragon.atlas'],
                    src: [
                        'spine/dragon@0.5x.atlas',
                        'spine/dragon.atlas',
                    ],
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
                }),
                pixiManifest({
                    createShortcuts: true,
                    trimExtensions: true,
                    includeMetaData: false
                }),
                spineAtlasManifestMod(),
                texturePackerManifestMod(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest =  sortObjectProperties(await readJSONSync(`${outputDir}/manifest.json`));

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: [
                        'folder/json.json',
                        'folder/json',
                        'json.json',
                        'json'
                    ],
                    src: [
                        'folder/json.json'
                    ]
                },
                {
                    alias: [
                        'folder/json.json5',
                        'folder/json',
                        'json.json5',
                        'json'
                    ],
                    src: [
                        'folder/json.json5'
                    ]
                },
                {
                    alias: [
                        'folder/sprite.png',
                        'folder/sprite',
                        'sprite.png',
                        'sprite'
                    ],
                    src: [
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@0.5x.png',
                        'folder/sprite.webp',
                        'folder/sprite.png',
                    ]
                },
                {
                    alias: [
                        'folder2/1.mp3',
                        'folder2/1',
                        '1.mp3',
                        '1'
                    ],
                    src: [
                        'folder2/1.ogg',
                        'folder2/1.mp3',
                    ]
                },
                {
                    alias: [
                        'folder2/folder3/1.mp3',
                        'folder2/folder3/1',
                        '1.mp3',
                        '1'
                    ],
                    src: [
                        'folder2/folder3/1.ogg',
                        'folder2/folder3/1.mp3',
                    ]
                },
                {
                    alias: [
                        'spine/dragon.json',
                        'spine/dragon',
                        'dragon.json',
                        'dragon'
                    ],
                    src: [
                        'spine/dragon.json'
                    ]
                },
                {
                    alias: [
                        'spine/dragon.atlas',
                        'spine/dragon',
                        'dragon.atlas',
                        'dragon'
                    ],
                    src: [
                        'spine/dragon@0.5x.atlas',
                        'spine/dragon.atlas',
                    ]
                }
            ]
        });
    });

    it('should not include spine atlas textures', async () =>
    {
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
                            content: assetPath(pkg, 'spine/dragon.atlas'),
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
                    includeMetaData: false
                }),
                spineAtlasManifestMod(),
                texturePackerManifestMod(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest =  sortObjectProperties((await readJSONSync(`${outputDir}/manifest.json`))) as any;

        expect(manifest.bundles[0]).toEqual({

            name: 'default',
            assets: [
                {
                    alias: [
                        'spine/dragon.atlas',
                        'dragon.atlas'
                    ],
                    src: [
                        'spine/dragon.atlas'
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
                }),
                pixiManifest({
                    createShortcuts: true,
                    trimExtensions: false,
                    includeMetaData: false
                }),
                spineAtlasManifestMod(),
                texturePackerManifestMod(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest =  sortObjectProperties((await readJSONSync(`${outputDir}/manifest.json`))) as any;

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
                        'folder/sprite.webp',
                        'folder/sprite.png',
                    ],
                },
                {
                    alias: ['folder2/1.mp3', '1.mp3'],
                    src: ['folder2/1.ogg', 'folder2/1.mp3'],
                },
                {
                    alias: ['folder2/folder3/1.mp3', '1.mp3'],
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
                }),
                pixiManifest({
                    createShortcuts: false,
                    trimExtensions: true,
                    includeMetaData: false
                }),
                spineAtlasManifestMod(),
                texturePackerManifestMod(),
            ],
        });

        await assetpack.run();

        // load the manifest json
        const manifest =  sortObjectProperties((await readJSONSync(`${outputDir}/manifest.json`))) as any;

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    alias: [
                        'folder/json.json',
                        'folder/json'
                    ],
                    src: [
                        'folder/json.json'
                    ]
                },
                {
                    alias: [
                        'folder/json.json5',
                        'folder/json'
                    ],
                    src: [
                        'folder/json.json5'
                    ]
                },
                {
                    alias: [
                        'folder/sprite.png',
                        'folder/sprite'
                    ],
                    src: [
                        'folder/sprite@0.5x.webp',
                        'folder/sprite@0.5x.png',
                        'folder/sprite.webp',
                        'folder/sprite.png',
                    ]
                },
                {
                    alias: [
                        'folder2/1.mp3',
                        'folder2/1'
                    ],
                    src: [
                        'folder2/1.ogg',
                        'folder2/1.mp3',
                    ]
                },
                {
                    alias: [
                        'folder2/folder3/1.mp3',
                        'folder2/folder3/1',
                    ],
                    src: [
                        'folder2/folder3/1.ogg',
                        'folder2/folder3/1.mp3',
                    ]
                },
                {
                    alias: [
                        'spine/dragon.json',
                        'spine/dragon'
                    ],
                    src: [
                        'spine/dragon.json'
                    ]
                },
                {
                    alias: [
                        'spine/dragon.atlas',
                        'spine/dragon'
                    ],
                    src: [
                        'spine/dragon@0.5x.atlas',
                        'spine/dragon.atlas',
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

    it('should ensure sub-manifests are created correctly', async () =>
    {
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
                            content: assetPath(pkg, 'audio/1.mp3'),
                        },
                    ],
                    folders: [],
                },
                {
                    name: 'sound2{m}',
                    files: [
                        {
                            name: '2.mp3',
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
            cache: false,
            pipes: [
                pixiManifest({
                    includeMetaData: false
                }),
            ],
        });

        await assetpack.run();

        expect(readJSONSync(`${outputDir}/manifest.json`)).toEqual({
            bundles: [
                {
                    name: 'default',
                    assets: []
                },
                {
                    name: 'sound2',
                    assets: [
                        {
                            alias: [
                                'sound2/2.mp3'
                            ],
                            src: [
                                'sound2/2.mp3'
                            ]
                        }
                    ]
                },
                {
                    name: 'sound',
                    assets: [
                        {
                            alias: [
                                'sound/1.mp3'
                            ],
                            src: [
                                'sound/1.mp3'
                            ]
                        }
                    ]
                }
            ]
        });
    });
});

function sortObjectProperties(obj: any)
{
    return Object.keys(obj).sort().reduce((acc: any, key: string) =>
    {
        const value = obj[key];

        if (typeof value === 'object' && !Array.isArray(value) && value !== null)
        {
            acc[key] = sortObjectProperties(value);
        }
        else
        {
            if (Array.isArray(value))
            {
                value.sort();
            }

            acc[key] = value;
        }

        return acc;
    }, {});
}
