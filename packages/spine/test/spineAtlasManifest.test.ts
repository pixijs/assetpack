import { readFileSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { spineAtlasManifestMod } from '../src/spineAtlasManifestMod';
import { AssetPack } from '@play-co/assetpack-core';
import { pixiManifest } from '@play-co/assetpack-plugin-manifest';

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
                        content: assetPath(pkg, 'dragon.atlas'),
                    },
                    {
                        name: 'dragon.json',
                        content: assetPath(pkg, 'dragon.json'),
                    },
                    {
                        name: 'dragon.png',
                        content: assetPath(pkg, 'dragon.png'),
                    },
                    {
                        name: 'dragon2.png',
                        content: assetPath(pkg, 'dragon2.png'),
                    },
                ],
                folders: [],
            });

        const assetpack = new AssetPack({
            entry: inputDir,
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
                        content: assetPath(pkg, 'dragon.atlas'),
                    },
                    {
                        name: 'dragon.json',
                        content: assetPath(pkg, 'dragon.json'),
                    },
                    {
                        name: 'dragon.png',
                        content: assetPath(pkg, 'dragon.png'),
                    },
                    {
                        name: 'dragon2.png',
                        content: assetPath(pkg, 'dragon2.png'),
                    },
                ],
                folders: [
                    {
                        name: 'nested',
                        files: [
                            {
                                name: 'dragon{spine}.atlas',
                                content: assetPath(pkg, 'dragon.atlas'),
                            },
                            {
                                name: 'dragon.json',
                                content: assetPath(pkg, 'dragon.json'),
                            },
                            {
                                name: 'dragon.png',
                                content: assetPath(pkg, 'dragon.png'),
                            },
                            {
                                name: 'dragon2.png',
                                content: assetPath(pkg, 'dragon2.png'),
                            },
                        ],
                        folders: []
                    }
                ],
            });

        const assetpack = new AssetPack({
            entry: inputDir,
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
