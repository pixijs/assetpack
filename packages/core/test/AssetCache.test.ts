import { Asset } from '../src/Asset';
import { AssetCache } from '../src/AssetCache';

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

        asset.addChild(assetChild);

        await assetCacheWrite.write(asset);

        const assetCacheRead = new AssetCache({
            cacheName,
        });

        const cachedAssetData = await assetCacheRead.read();

        expect(cachedAssetData).toEqual({
            test: {
                isFolder: true,
                lastModified: 0,
                metaData: {}
            },
            'test/test.json': {
                isFolder: false,
                lastModified: 0,
                parent: 'test',
                metaData: {}
            }
        });
    });
});
