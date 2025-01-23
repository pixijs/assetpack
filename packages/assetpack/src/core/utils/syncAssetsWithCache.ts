import { Asset } from '../Asset.js';

import type { CachedAsset } from '../AssetCache.js';

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
            assetToDelete.transformData = cachedAsset.transformData;
            assetToDelete.inheritedMetaData = cachedAsset.inheritedMetaData;

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
        let asset = assetHash[i];

        if (!asset)
        {
            asset = new Asset({
                path: i,
                isFolder: cachedAssetData.isFolder
            });

            transformedAssets[i] = asset;
            assetHash[i] = asset;

            asset.transformParent = assetHash[cachedAssetData.transformParent!];
        }

        asset.inheritedMetaData = cachedAssetData.inheritedMetaData;
        asset.transformData = cachedAssetData.transformData;
        asset.metaData = cachedAssetData.metaData;
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
