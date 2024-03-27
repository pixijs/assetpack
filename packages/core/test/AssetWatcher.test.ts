import { assetPath, createFolder, getInputDir } from '../../../shared/test';
import { Asset } from '../src/Asset';
import { AssetWatcher } from '../src/AssetWatcher';
import { AssetCache } from '../src/AssetCache';
import { logAssetGraph } from '../src/utils/logAssetGraph';

const pkg = 'core';

describe('AssetWatcher', () =>
{
    it('should have correct file state with no cache', async () =>
    {
        const testName = 'asset-watcher';
        const inputDir = getInputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'foo.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                ],
                folders: [],
            });

        const assetWatcher = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: null,
            onUpdate: async (root: Asset) =>
            {
                expect(root.state).toBe('added');
                expect(root.children[0].state).toBe('added');
            },
            onComplete: async (root: Asset) =>
            {
                expect(root.state).toBe('normal');
                expect(root.children[0].state).toBe('normal');
            }
        });

        await assetWatcher.run();
    });

    it('should have correct file state with a cache', async () =>
    {
        const testName = 'asset-watcher';
        const inputDir = getInputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'foo.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                ],
                folders: [],
            });

        const assetCache = new AssetCache({
            cacheName: testName
        });

        const assetWatcher = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: null,
            onUpdate: async (root: Asset) =>
            {
                expect(root.state).toBe('added');
                expect(root.children[0].state).toBe('added');
            },
            onComplete: async (root: Asset) =>
            {
                expect(root.state).toBe('normal');
                expect(root.children[0].state).toBe('normal');

                await assetCache.write(root);
            }
        });

        await assetWatcher.run();

        // now run again with a cache

        const assetWatcherWithCacheData = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: await assetCache.read(),
            onUpdate: async (root: Asset) =>
            {
                expect(root.state).toBe('normal');
                expect(root.children[0].state).toBe('normal');
            },
            onComplete: async (root: Asset) =>
            {
                expect(root.state).toBe('normal');
                expect(root.children[0].state).toBe('normal');

                await assetCache.write(root);
            }
        });

        await assetWatcherWithCacheData.run();

        // and a final time to check that a warm cache is working
        const assetWatcherWithCacheDataWarm = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: await assetCache.read(),
            onUpdate: async (root: Asset) =>
            {
                expect(root.state).toBe('normal');
                expect(root.children[0].state).toBe('normal');
            },
            onComplete: async (root: Asset) =>
            {
                expect(root.state).toBe('normal');
                expect(root.children[0].state).toBe('normal');
            }
        });

        await assetWatcherWithCacheDataWarm.run();
    });

    it('should have a correct state of transformed children', async () =>
    {
        const testName = 'asset-watcher-cache';
        const inputDir = getInputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'foo{bloop}.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                ],
                folders: [],
            });

        const assetCache = new AssetCache({
            cacheName: testName
        });

        const onUpdate = async (root: Asset) =>
        {
            const json = root.children[0];

            if (json.state === 'modified' || json.state === 'added')
            {
                const newAsset = new Asset({
                    path: 'fi.json',
                });

                newAsset.metaData.test = true;

                json.transformChildren = [];
                json.addTransformChild(newAsset);
            }
        };

        const onComplete = async (root: Asset) =>
        {
            const json = root.children[0];

            const transformed = json.transformChildren[0];

            expect(transformed.path).toBe('fi.json');

            expect(transformed.metaData).toStrictEqual({
                test: true,
            });

            expect(transformed.allMetaData).toStrictEqual({
                test: true,
                bloop: true,
            });

            await assetCache.write(root);
        };

        const assetWatcher = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: null,
            onUpdate,
            onComplete
        });

        await assetWatcher.run();

        const assetWatcherFromCache = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: await assetCache.read(),
            onUpdate: async () =>
            {
                // nothing to do! as it SHOULD be cached :D
            },
            onComplete
        });

        await assetWatcherFromCache.run();
    });

    it('should ignore files with the ignore tag', async () =>
    {
        const testName = 'asset-watcher-ignore';
        const inputDir = getInputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'foo.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                    {
                        name: 'badfoo{ignore}.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                ],
                folders: [
                    {
                        name: 'don-need{ignore}',
                        files: [
                            {
                                name: 'badFoo.json',
                                content: assetPath(pkg, 'json.json'),
                            }
                        ],
                        folders: [],
                    }
                ],
            });

        const assetWatcher = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: null,
            onUpdate: async (root: Asset) =>
            {
                expect(root.children.length).toBe(1);
            },
            onComplete: async (root: Asset) =>
            {
                expect(root.children.length).toBe(1);
            }
        });

        await assetWatcher.run();
    });

    it('should ignore files with the ignore with blob', async () =>
    {
        const testName = 'asset-watcher-ignore-glob';
        const inputDir = getInputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'foo.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                    {
                        name: 'foofoo.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                ],
                folders: [
                    {
                        name: 'don-need',
                        files: [
                            {
                                name: 'foofop.json',
                                content: assetPath(pkg, 'json.json'),
                            }
                        ],
                        folders: [],
                    }
                ],
            });

        const assetWatcher = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: null,
            ignore: '**/*.json',
            onUpdate: async (root: Asset) =>
            {
                logAssetGraph(root);

                expect(root.children.length).toBe(1);
            },
            onComplete: async (root: Asset) =>
            {
                expect(root.children.length).toBe(1);
            }
        });

        await assetWatcher.run();
    });

    it('should apply the correct settings to assets ', async () =>
    {
        const testName = 'asset-watcher-settings';
        const inputDir = getInputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'foo.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                    {
                        name: 'foofoo.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                ],
                folders: [
                    {
                        name: 'don-need',
                        files: [
                            {
                                name: 'foofop.json',
                                content: assetPath(pkg, 'json.json'),
                            },
                            {
                                name: 'foofopfee.png',
                                content: assetPath(pkg, 'json.json'),
                            }
                        ],
                        folders: [],
                    }
                ],
            });

        const settings = {
            json: {
                test: 'test',
            }
        };

        const assetWatcher = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: null,
            assetSettingsData: [
                {
                    files: ['**/*.json'],
                    settings
                }
            ],
            onUpdate: async (root: Asset) =>
            {
                logAssetGraph(root);

                expect(root.children.length).toBe(3);
                expect(root.children[0].children.length).toBe(2);

                expect(root.children[0].settings).toBeUndefined();
                expect(root.children[1].settings).toStrictEqual(settings);
                expect(root.children[2].settings).toStrictEqual(settings);

                expect(root.children[0].children[0].settings).toStrictEqual(settings);
                expect(root.children[0].children[1].settings).toBeUndefined();
            },
            onComplete: async (_root: Asset) =>
            {
                // nothing to do
            }
        });

        await assetWatcher.run();
    });

    it('should apply the correct metaData to assets ', async () =>
    {
        const testName = 'asset-watcher-metaData';
        const inputDir = getInputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'foo.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                    {
                        name: 'foofoo.json',
                        content: assetPath(pkg, 'json.json'),
                    },
                ],
                folders: [
                    {
                        name: 'don-need',
                        files: [
                            {
                                name: 'foofop{hi}.json',
                                content: assetPath(pkg, 'json.json'),
                            },
                            {
                                name: 'foofopfee{hi}.png',
                                content: assetPath(pkg, 'json.json'),
                            }
                        ],
                        folders: [],
                    }
                ],
            });

        const assetWatcher = new AssetWatcher({
            entryPath: inputDir,
            assetCacheData: null,
            assetSettingsData: [
                {
                    files: ['**/*.json'],
                    metaData: {
                        nc: true,
                    }
                }
            ],
            onUpdate: async (root: Asset) =>
            {
                logAssetGraph(root);

                expect(root.children[0].metaData).toStrictEqual({});
                expect(root.children[1].metaData).toStrictEqual({
                    nc: true,
                });
                expect(root.children[2].metaData).toStrictEqual({
                    nc: true,
                });

                expect(root.children[0].children[0].metaData).toStrictEqual({
                    hi: true,
                });
                expect(root.children[0].children[1].metaData).toStrictEqual({
                    hi: true,
                    nc: true,
                });
            },
            onComplete: async (_root: Asset) =>
            {
                // nothing to do
            }
        });

        await assetWatcher.run();
    });
});
