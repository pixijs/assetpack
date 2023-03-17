import type { ChildTree, RootTree, Tags, TransformedTree } from './AssetPack';
import { Logger } from './logger/Logger';

class CacheClass<T>
{
    public cache: Map<string, T> = new Map();

    /** Clear all entries. */
    public reset(): void
    {
        this.cache.clear();
    }

    /**
     * Check if the key exists
     * @param key - The key to check
     */
    public has(key: string): boolean
    {
        return this.cache.has(key);
    }

    /**
     * Fetch entry by key
     * @param key - The key of the entry to get
     */
    public get(key: string): T
    {
        const result = this.cache.get(key);

        if (!result)
        {
            Logger.warn(`[Assets] Asset id ${key} was not found in the Cache`);
        }

        return result as T;
    }

    /**
     * Set a value by key or keys name
     * @param key - The key or keys to set
     * @param value - The value to store in the cache or from which cacheable assets will be derived.
     */
    public set(key: string, value: T): void
    {
        if (this.cache.has(key) && this.cache.get(key) !== value)
        {
            Logger.warn(`[Cache] already has key: ${key}`);
        }

        this.cache.set(key, value);
    }

    /**
     * Remove entry by key
     *
     * This function will also remove any associated alias from the cache also.
     * @param key - The key of the entry to remove
     */
    public remove(key: string): void
    {
        if (!this.cache.has(key))
        {
            Logger.warn(`[Assets] Asset id ${key} was not found in the Cache`);

            return;
        }

        this.cache.delete(key);
    }

    public log(): void
    {
        Logger.info(`[Cache] Cache size: ${this.cache.size}`);
        Logger.info(`[Cache] Cache keys: ${Array.from(this.cache.keys()).join(', ')}`);
        Logger.info(`[Cache] Cache values: ${Array.from(this.cache.values()).join(', ')}`);
    }
}

export interface TransformDataFile
{
    name?: string,
    paths: string[],
    data?: {
        tags?: Tags,
        [x: string]: any
    },
}

export interface TransformData
{
    type: string,
    files: TransformDataFile[],
    [x: string]: any
}

export interface CacheableAsset
{
    tree: ChildTree | TransformedTree | RootTree;
    transformData: TransformData
}

export const SavableAssetCache = new CacheClass<CacheableAsset>();
