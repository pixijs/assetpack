import type { Asset } from './Asset';
import { ensureDirSync, readJSONSync, writeJSONSync } from 'fs-extra';
import { path } from './utils/path';

export interface AssetCacheOptions
{
    cacheName?: string;
}

export class AssetCache
{
    private _assetCacheData: AssetCacheData | undefined;
    private _cacheName: any;

    constructor({ cacheName }: AssetCacheOptions = {})
    {
        this._cacheName = cacheName ?? 'assets';
    }
    // save a file to disk
    read()
    {
        if (this._assetCacheData) return this._assetCacheData.assets;

        try
        {
            this._assetCacheData = readJSONSync(`.assetpack/${this._cacheName}.json`) as AssetCacheData;

            return this._assetCacheData.assets;
        }
        catch (e)
        {
            return null;
        }
    }

    write(asset: Asset)
    {
        const schema: AssetCacheData = {
            assets: {}
        };

        this._serializeAsset(asset, schema.assets, true);

        // get root dir in node
        ensureDirSync(path.joinSafe('.assetpack'));

        writeJSONSync(`.assetpack/${this._cacheName}.json`, schema, { spaces: 4 });
    }

    private _serializeAsset(asset: Asset, schema: AssetCacheData['assets'], saveHash = false)
    {
        const serializeAsset: CachedAsset = {
            isFolder: asset.isFolder,
            parent: asset.parent?.path,
            transformParent: asset.transformParent?.path,
            metaData: asset.metaData
        };

        if (!asset.isFolder && saveHash)
        {
            serializeAsset.hash = asset.hash;
        }

        schema[asset.path] = serializeAsset;

        asset.children.forEach((child) =>
        {
            this._serializeAsset(child, schema, true);
        });

        asset.transformChildren.forEach((child) =>
        {
            // we don't care about hashes for transformed children!
            this._serializeAsset(child, schema);
        });
    }
}

export interface CachedAsset
{
    isFolder: boolean;
    hash?: string;
    parent: string | undefined;
    metaData: Record<string, any>;
    transformParent: string | undefined;
}

type AssetCacheData = {
    assets: Record<string, CachedAsset>;
};
