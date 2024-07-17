import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { pixiManifest } from '../../src/manifest/index.js';
import { spineAtlasManifestMod } from '../../src/spine/spineAtlasManifestMod.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'spine';

describe('Atlas Manifest', () =>
{
    it('should allow for options to be overridden', async () =>
    {
        const testName = 'manifest';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
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
            });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                pixiManifest(),
                spineAtlasManifestMod(),
            ]
        });

        await assetpack.run();

        const manifest = JSON.parse(readFileSync(`${outputDir}/manifest.json`).toString());

        expect(manifest).toEqual({
            bundles: [
                {
                    name: 'default',
                    assets: [
                        {
                            alias: [
                                'dragon.json'
                            ],
                            src: [
                                'dragon.json'
                            ],
                            data: {
                                tags: {}
                            }
                        },
                        {
                            alias: [
                                'dragon.atlas'
                            ],
                            src: [
                                'dragon.atlas'
                            ],
                            data: {
                                tags: {
                                    spine: true
                                }
                            }
                        }
                    ]
                }
            ]
        });
    });

    it('should allow for options to be overridden and the assets are nested', async () =>
    {
        const testName = 'manifest-nested';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
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
                folders: [
                    {
                        name: 'nested',
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
                        folders: []
                    }
                ],
            });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                pixiManifest(),
                spineAtlasManifestMod(),
            ]
        });

        await assetpack.run();

        const manifest = JSON.parse(readFileSync(`${outputDir}/manifest.json`).toString());

        expect(manifest).toEqual(
            {
                bundles: [
                    {
                        name: 'default',
                        assets: [
                            {
                                alias: [
                                    'dragon.json'
                                ],
                                src: [
                                    'dragon.json'
                                ],
                                data: {
                                    tags: {}
                                }
                            },
                            {
                                alias: [
                                    'dragon.atlas'
                                ],
                                src: [
                                    'dragon.atlas'
                                ],
                                data: {
                                    tags: {
                                        spine: true
                                    }
                                }
                            },
                            {
                                alias: [
                                    'nested/dragon.json'
                                ],
                                src: [
                                    'nested/dragon.json'
                                ],
                                data: {
                                    tags: {}
                                }
                            },
                            {
                                alias: [
                                    'nested/dragon.atlas'
                                ],
                                src: [
                                    'nested/dragon.atlas'
                                ],
                                data: {
                                    tags: {
                                        spine: true
                                    }
                                }
                            }
                        ]
                    }
                ]
            }

        );
    });
});
