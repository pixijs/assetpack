import { describe, expect, it } from 'vitest';
import { Asset } from '../../src/core/Asset.js';
import { AssetCache } from '../../src/core/AssetCache.js';

describe('AssetCache', () =>
{
    it('should write and read cache correctly', async () =>
    {
        const cacheName = 'asset-cache-test';

        const assetCacheWrite = new AssetCache({
            cacheName,

        });

        const asset = new Asset({
            isFolder: true,
            path: 'test',
        });

        const assetChild = new Asset({
            isFolder: false,
            path: 'test/test.json',
        });

        assetChild['_hash'] = '12345';

        asset.addChild(assetChild);

        await assetCacheWrite.write(asset);

        const assetCacheRead = new AssetCache({
            cacheName,
        });

        const cachedAssetData = await assetCacheRead.read();

        expect(cachedAssetData).toEqual({
            test: {
                isFolder: true,
                metaData: {},
                transformData: {},
            },
            'test/test.json': {
                isFolder: false,
                hash: '12345',
                parent: 'test',
                transformData: {},
                metaData: {}
            }
        });
    });
});
