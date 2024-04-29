import { Asset } from '../Asset';

import type { CachedAsset } from '../AssetCache';

export function syncAssetsWithCache(assetHash: Record<string, Asset>, cachedData: Record<string, CachedAsset>)
{
    syncAssetsFromCache(assetHash, cachedData);
    syncTransformedAssetsFromCache(assetHash, cachedData);
}

function syncAssetsFromCache(assetHash: Record<string, Asset>, cachedData: Record<string, CachedAsset>)
{
    const deletedAssets: Record<string, Asset> = {};

    // check for deletions..
    for (const i in cachedData)
    {
        const cachedAsset = cachedData[i];

        if (!assetHash[i] && !cachedAsset.transformParent)
        {
            // deleted!
            const assetToDelete = new Asset({
                path: i,
                isFolder: cachedAsset.isFolder
            });

            assetToDelete.metaData = cachedAsset.metaData;

            assetToDelete.state = 'deleted';

            deletedAssets[i] = assetToDelete;

            assetHash[i] = assetToDelete;
        }
    }

    for (const i in deletedAssets)
    {
        const deletedAsset = deletedAssets[i];

        const cachedAsset = cachedData[i];

        if (cachedAsset.parent)
        {
            assetHash[cachedAsset.parent].addChild(deletedAsset);
        }
    }

    // next we check for modifications and additions

    // so things are new! or modified..
    for (const i in assetHash)
    {
        const asset = assetHash[i];

        if (asset.state === 'deleted')
        {
            asset.markParentAsModified();
            continue;
        }

        if (!cachedData[i])
        {
            // new asset!
            asset.state = 'added';
            // TODO - move this into the asset!
            asset.markParentAsModified(asset);
        }
        else if (!asset.isFolder && (cachedData[i].hash !== asset.hash))
        {
            asset.state = 'modified';
            asset.markParentAsModified(asset);
        }
        else
        {
            asset.state = 'normal';
        }
    }
}

function syncTransformedAssetsFromCache(assetHash: Record<string, Asset>, cachedData: Record<string, CachedAsset>)
{
    const transformedAssets: Record<string, Asset> = {};

    // check for deletions..
    for (const i in cachedData)
    {
        const cachedAssetData = cachedData[i];

        if (cachedAssetData.transformParent)
        {
            const transformedAsset = new Asset({
                path: i,
                isFolder: cachedAssetData.isFolder
            });

            transformedAsset.metaData = cachedAssetData.metaData;

            transformedAssets[i] = transformedAsset;
            assetHash[i] = transformedAsset;

            transformedAsset.transformParent = assetHash[cachedAssetData.transformParent];
        }
    }

    for (const i in transformedAssets)
    {
        const transformedAsset = transformedAssets[i];

        if (transformedAsset.transformParent)
        {
            assetHash[transformedAsset.transformParent.path].addTransformChild(transformedAssets[i]);
        }
        else
        {
            throw new Error('[AssetPack] transformed asset has no parent!');
        }
    }
}
