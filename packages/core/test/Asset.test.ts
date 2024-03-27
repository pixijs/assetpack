import { Asset } from '../src/Asset';

describe('Asset', () =>
{
    it('should extract metadata from filename tags', async () =>
    {
        const asset = new Asset({
            path: 'folder{fi}/test{foo}.png',
            isFolder: false,
        });

        // it should not include the folder tags as they should be inherited by its
        // parent asset
        expect(asset.metaData).toEqual({
            foo: true,
        });
    });

    it('child asset should inherit metadata', async () =>
    {
        const folderAsset = new Asset({
            path: 'folder{fi}',
            isFolder: false,
        });

        const asset = new Asset({
            path: 'folder{fi}/test{foo}.png',
            isFolder: false,
        });

        folderAsset.addChild(asset);

        expect(asset.allMetaData).toEqual({
            fi: true,
            foo: true,
        });

        expect(asset.metaData).toEqual({
            foo: true,
        });

        expect(asset.inheritedMetaData).toEqual({
            fi: true,
        });
    });

    it('transformed child asset should inherit metadata', async () =>
    {
        const originalAsset = new Asset({
            path: 'test{fi}.png',
            isFolder: false,
        });

        const modifiedAsset = new Asset({
            path: 'test{foo}.png',
            isFolder: false,
        });

        originalAsset.addTransformChild(modifiedAsset);

        expect(modifiedAsset.allMetaData).toEqual({
            fi: true,
            foo: true,
        });

        expect(modifiedAsset.metaData).toEqual({
            foo: true,
        });

        expect(modifiedAsset.inheritedMetaData).toEqual({
            fi: true,
        });
    });
});
