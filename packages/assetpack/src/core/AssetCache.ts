import fs from 'fs-extra';
import { path } from './utils/path.js';

import type { Asset, TransformStats } from './Asset.js';

export interface AssetCacheOptions
{
    cacheName?: string;
}

/**
 * Interface representing the Asset Cache.
 * This interface defines the methods required for reading from and writing to the asset cache.
 */
export interface IAssetCache
{
    /**
     * Reads the asset cache and returns a record of cached assets.
     * @returns {Record<string, CachedAsset>} A record containing the cached assets.
     */
    read(): Record<string, CachedAsset>;

    /**
     * Writes an asset to the cache. this is usually the root asset.
     * @param {Asset} asset - The asset to be written to the cache.
     */
    write(asset: Asset): void;

    /**
     * Checks if the asset cache exists.
     * @returns {boolean} Whether the asset cache exists.
     */
    exists(): boolean;
}

export class AssetCache implements IAssetCache
{
    public static location = '.assetpack';
    private _assetCacheData: AssetCacheData | undefined;
    private _cacheName: string;

    constructor({ cacheName }: AssetCacheOptions = {})
    {
        this._cacheName = cacheName ?? 'assets';
    }

    exists()
    {
        return fs.existsSync(`${AssetCache.location}/${this._cacheName}.json`);
    }

    // save a file to disk
    read()
    {
        if (this._assetCacheData) return this._assetCacheData.assets;

        try
        {
            this._assetCacheData = fs.readJSONSync(`${AssetCache.location}/${this._cacheName}.json`) as AssetCacheData;

            return this._assetCacheData.assets;
        }
        catch (e)
        {
            return {};
        }
    }

    write(asset: Asset)
    {
        const schema: AssetCacheData = {
            assets: {}
        };

        this._serializeAsset(asset, schema.assets, true);

        // get root dir in node
        fs.ensureDirSync(path.joinSafe(AssetCache.location));

        fs.writeJSONSync(`${AssetCache.location}/${this._cacheName}.json`, schema, { spaces: 4 });

        // assign the schema to the cache data
        this._assetCacheData = schema;
    }

    private _serializeAsset(asset: Asset, schema: AssetCacheData['assets'], saveHash = false)
    {
        const serializeAsset: CachedAsset = this.toCacheData(asset, saveHash);

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

    private toCacheData(asset: Asset, saveHash: boolean): CachedAsset
    {
        const data: CachedAsset = {
            isFolder: asset.isFolder,
            parent: asset.parent?.path,
            transformParent: asset.transformParent?.path,
            metaData: { ...asset.metaData },
            inheritedMetaData: { ...asset.inheritedMetaData },
            transformData: { ...asset.transformData },
            stats: asset.stats ? { ...asset.stats } : undefined
        };

        if (!asset.isFolder && saveHash)
        {
            data.hash = asset.hash;
        }

        return data;
    }
}

export interface CachedAsset
{
    isFolder: boolean;
    hash?: string;
    parent: string | undefined;
    metaData: Record<string, any>;
    inheritedMetaData: Record<string, any>;
    transformData: Record<string, any>;
    transformParent: string | undefined;
    stats: TransformStats | undefined;
}

type AssetCacheData = {
    assets: Record<string, CachedAsset>;
};
