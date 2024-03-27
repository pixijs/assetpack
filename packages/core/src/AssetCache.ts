import { joinSafe } from 'upath';
import type { Asset } from './Asset';
import { ensureDirSync, readJSONSync, writeJSONSync } from 'fs-extra';

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

        this._serializeAsset(asset, schema.assets);

        // get root dir in node
        ensureDirSync(joinSafe('.assetpack'));

        writeJSONSync(`.assetpack/${this._cacheName}.json`, schema, { spaces: 4 });
    }

    private _serializeAsset(asset: Asset, schema: AssetCacheData['assets'])
    {
        const serializeAsset: CachedAsset = {
            isFolder: asset.isFolder,
            lastModified: asset.lastModified,
            parent: asset.parent?.path,
            transformParent: asset.transformParent?.path,
            metaData: asset.metaData
        };

        schema[asset.path] = serializeAsset;

        asset.children.forEach((child) =>
        {
            this._serializeAsset(child, schema);
        });

        asset.transformChildren.forEach((child) =>
        {
            this._serializeAsset(child, schema);
        });
    }
}

export interface CachedAsset
{
    isFolder: boolean;
    lastModified: number;
    parent: string | undefined;
    metaData: Record<string, any>;
    transformParent: string | undefined;
}

type AssetCacheData = {
    assets: Record<string, CachedAsset>;
};
