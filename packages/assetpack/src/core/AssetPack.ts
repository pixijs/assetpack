import fs from 'fs-extra';
import merge from 'merge';
import { AssetCache } from './AssetCache.js';
import { AssetWatcher } from './AssetWatcher.js';
import { Logger } from './logger/Logger.js';
import { finalCopyPipe } from './pipes/finalCopyPipe.js';
import { PipeSystem } from './pipes/PipeSystem.js';
import { generateCacheName } from './utils/generateCacheName.js';
import { path } from './utils/path.js';
import { promiseAllConcurrent } from './utils/promiseAllConcurrent.js';

import type { Asset, TransformStats } from './Asset.js';
import type { AssetPackConfig } from './config.js';
import type { AssetPipe } from './pipes/AssetPipe.js';
import type { AssetSettings } from './pipes/PipeSystem.js';

export class AssetPack
{
    private _defaultConfig: AssetPackConfig = {
        entry: './static',
        output: './dist',
        ignore: [],
        cache: true,
        cacheLocation: '.assetpack',
        logLevel: 'info',
        pipes: [],
    };

    readonly config: AssetPackConfig;

    private _pipeSystem: PipeSystem;
    private _assetWatcher: AssetWatcher;
    private _entryPath = '';
    private _outputPath = '';

    constructor(config: AssetPackConfig = {})
    {
        this.config = merge.recursive(true, this._defaultConfig, config);
        this._entryPath = normalizePath(this.config.entry as string);
        this._outputPath = normalizePath(this.config.output as string);

        Logger.init({
            level: this.config.logLevel || 'info',
        });

        const { pipes, cache, cacheLocation } = this.config;

        AssetCache.location = cacheLocation!;
        let assetCache: AssetCache | undefined;

        // if there is no cache, lets just go ahead and remove the output folder
        // and the cached info folder
        if (!cache)
        {
            fs.removeSync(this._outputPath);
            fs.removeSync(cacheLocation!);
        }
        else
        {
            // create the asset cache, this is used to store the asset graph information
            // so if you restart the process, it can pick up where it left off
            assetCache = new AssetCache({
                cacheName: generateCacheName(this.config),
            });

            // read the cache data, this will be used to restore the asset graph
            // by the AssetWatcher
            if (assetCache.exists())
            {
                Logger.info('[AssetPack] cache found.');
            }
            else
            {
                Logger.warn('[AssetPack] cache not found, clearing output folder');

                // to be safe - lets nuke the folder as the cache is empty
                fs.removeSync(this._outputPath);
            }
        }

        // make sure the output folders exists
        fs.ensureDirSync(this._outputPath);
        fs.ensureDirSync(cacheLocation!);

        // create the pipe system, this is used to transform the assets
        // we add the finalCopyPipe to the end of the pipes array. This is a pipe
        // that will copy the final files to the output folder
        this._pipeSystem = new PipeSystem({
            outputPath: this._outputPath,
            entryPath: this._entryPath,
            pipes: [...pipes as AssetPipe[], finalCopyPipe],
        });

        // create the asset watcher, this is used to watch the file system for changes
        // it will also restore the asset graph from the cache data provided
        // onUpdate is called when the asset graph is updated / changed. Any assets that have
        // changed, will have a state marked as either 'added', 'modified' or 'deleted'
        // onComplete is called when onUpdate is finished, this is where you can do any cleanup
        // or final tasks - which for now is just writing the asset graph back to the cache
        // so it can be restored even if the process is terminated
        this._assetWatcher = new AssetWatcher({
            entryPath: this._entryPath,
            assetCache,
            ignore: this.config.ignore,
            assetSettingsData: this.config.assetSettings as AssetSettings[] || [],
            onUpdate: async (root: Asset) =>
            {
                Logger.report({
                    type: 'buildProgress',
                    phase: 'transform',
                    message: '0'
                });

                await this._transform(root).catch((e) =>
                {
                    Logger.error(`[AssetPack] Transform failed: ${e.message}`);
                });

                Logger.report({
                    type: 'buildSuccess',
                });
            },
            onComplete: async (root: Asset) =>
            {
                if (cache)
                {
                    // write back to the cache...
                    (assetCache as AssetCache).write(root);

                    // release the buffers from the cache
                    root.releaseChildrenBuffers();

                    Logger.info('cache updated.');
                }
            }
        });
    }

    /**
     * Run the asset pack, this will transform all the assets and resolve when it's done
     */
    public async run()
    {
        await this._assetWatcher.run();
    }

    /**
     * Watch the asset pack, this will watch the file system for changes and transform the assets.
     * you can enable this when in development mode
     */
    public watch()
    {
        return this._assetWatcher.watch();
    }

    public stop()
    {
        return this._assetWatcher.stop();
    }

    public get rootAsset()
    {
        return this._assetWatcher.root;
    }

    private async _transform(asset: Asset)
    {
        await this._pipeSystem.start(asset);

        const assetsToTransform: Asset[] = [];

        this.deleteAndCollectAssetsToTransform(asset, assetsToTransform);

        let index = 0;

        const all = assetsToTransform.map((asset) =>
            (async () =>
            {
                if (asset.skip) return;

                const stats = asset.stats = {
                    date: Date.now(),
                    duration: 0,
                    success: true,
                } as TransformStats;

                const now = performance.now();

                await this._pipeSystem.transform(asset).catch((e) =>
                {
                    stats.success = false;
                    stats.error = e.message;

                    // eslint-disable-next-line max-len
                    Logger.error(`[AssetPack] Transform failed:\ntransform: ${e.name}\nasset:${asset.path}\nerror:${e.message}`);
                });

                stats.duration = performance.now() - now;

                index++;

                const percent = Math.round((index / assetsToTransform.length) * 100);

                Logger.report({
                    type: 'buildProgress',
                    phase: 'transform',
                    message: percent.toString()
                });
            }));

        await promiseAllConcurrent(all, 5);

        await this._pipeSystem.finish(asset);
    }

    private deleteAndCollectAssetsToTransform(asset: Asset, output: Asset[])
    {
        if (asset.state !== 'normal')
        {
            if (asset.state === 'deleted')
            {
                deleteAssetFiles(asset);
            }
            else
            {
                output.push(asset);
            }

            for (let i = 0; i < asset.children.length; i++)
            {
                this.deleteAndCollectAssetsToTransform(asset.children[i], output);
            }
        }
    }
}

export async function deleteAssetFiles(asset: Asset)
{
    asset.transformChildren.forEach((child) =>
    {
        _deleteAsset(child);
    });
}

function _deleteAsset(asset: Asset)
{
    asset.transformChildren.forEach((child) =>
    {
        _deleteAsset(child);
    });

    if (!asset.isFolder)
    {
        fs.removeSync(asset.path);
    }
}

function normalizePath(pth: string)
{
    pth = path.normalizeTrim(pth);

    if (!path.isAbsolute(pth))
    {
        pth = path.normalizeTrim(path.join(process.cwd(), pth));
    }

    return pth;
}

