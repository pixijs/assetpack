import fs from 'fs-extra';
import type { Asset } from './Asset';
import type { AssetPipe } from './pipes/AssetPipe';
import { AssetCache } from './AssetCache';
import { AssetWatcher } from './AssetWatcher';
import type { AssetSettings } from './pipes/PipeSystem';
import { PipeSystem } from './pipes/PipeSystem';
import { finalCopyPipe } from './pipes/finalCopyPipe';
import type { AssetPackConfig } from './config';
import objectHash from 'object-hash';
import { Logger } from './logger/Logger';
import { promiseAllConcurrent } from './utils/promiseAllConcurrent';
import { path } from './utils/path';

export class AssetPack
{
    public static defaultConfig: AssetPackConfig = {
        entry: './static',
        output: './dist',
        ignore: [],
        cache: true,
        logLevel: 'info',
        pipes: [],
        // files: []
    };

    readonly config: AssetPackConfig;

    private _pipeSystem: PipeSystem;
    private _assetWatcher: AssetWatcher;
    private _entryPath = '';
    private _outputPath = '';

    constructor(config: AssetPackConfig = {})
    {
        config = { ...AssetPack.defaultConfig, ...config };
        this.config = config;
        this._entryPath = normalizePath(config.entry as string);
        this._outputPath = normalizePath(config.output as string);

        Logger.init({
            level: config.logLevel || 'info'
        });

        const { pipes, cache, ...configWithoutPlugins } = config;

        // make a hash..
        const cacheName = [objectHash(configWithoutPlugins), ...(pipes as AssetPipe[]).map((pipe) => pipe.name)].join('-');

        let assetCacheData = null;
        let assetCache: AssetCache | null = null;

        // if there is no cache, lets just go ahead and remove the output folder
        // and the cached info folder
        if (!cache)
        {
            fs.removeSync(this._outputPath);
            fs.removeSync('.assetpack');
        }
        else
        {
            // create the asset cache, this is used to store the asset graph information
            // so if you restart the process, it can pick up where it left off
            assetCache = new AssetCache({
                cacheName
            });

            // read the cache data, this will be used to restore the asset graph
            // by the AssetWatcher
            assetCacheData = assetCache.read();

            if (assetCacheData)
            {
                Logger.info('cache found.');
            }
        }

        // make sure the output folders exists
        fs.ensureDirSync(this._outputPath);
        fs.ensureDirSync('.assetpack');

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
            assetCacheData,
            ignore: config.ignore,
            assetSettingsData: config.assetSettings as AssetSettings[] || [],
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
                    await (assetCache as AssetCache).write(root);

                    Logger.info('cache updated.');
                }
            }
        });

        Logger.report({
            type: 'buildStart',
            message: config.entry,
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

    private async _transform(asset: Asset)
    {
        await this._pipeSystem.start(asset);

        const assetsToTransform: Asset[] = [];

        this.deleteAndCollectAssetsToTransform(asset, assetsToTransform);

        let index = 0;

        const all = assetsToTransform.map((asset) =>
            (async () =>
            {
                await this._pipeSystem.transform(asset);
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
                deleteAsset(asset);
            }
            else
            {
                output.push(asset);
            }

            if (!asset.ignoreChildren)
            {
                for (let i = 0; i < asset.children.length; i++)
                {
                    this.deleteAndCollectAssetsToTransform(asset.children[i], output);
                }
            }
        }
    }
}

async function deleteAsset(asset: Asset)
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
    pth = path.normalizeSafe(pth);

    if (!path.isAbsolute(pth))
    {
        pth = path.normalizeSafe(path.join(process.cwd(), pth));
    }

    return pth;
}
