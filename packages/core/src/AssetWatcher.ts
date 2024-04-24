import fs from 'fs-extra';
import { Asset } from './Asset';
import chokidar from 'chokidar';
import type { CachedAsset } from './AssetCache';
import { syncAssetsWithCache } from './utils/syncAssetsWithCache';
import { AssetIgnore } from './AssetIgnore';
import type { AssetSettings } from './pipes/PipeSystem';
import { applySettingToAsset } from './utils/applySettingToAsset';
import { path } from './utils/path';
import { Logger } from './logger/Logger';

export interface AssetWatcherOptions
{
    entryPath: string;
    assetCacheData?: Record<string, CachedAsset> | null;
    assetSettingsData?: AssetSettings[];
    ignore?: string | string[];
    onUpdate: (root: Asset) => Promise<void>;
    onComplete: (root: Asset) => Promise<void>;
}

interface ChangeData
{
    type: string;
    file: string;
}

export class AssetWatcher
{
    private _watcher: chokidar.FSWatcher | undefined;
    private _assetHash: Record<string, Asset> = {};

    private _changes: ChangeData[] = [];

    private _entryPath = '';
    private _root: Asset = new Asset({ path: 'noop', isFolder: true });
    private _timeoutId: NodeJS.Timeout | undefined;
    private _onUpdate: (root: Asset) => Promise<void>;
    private _updatingPromise: Promise<void> = Promise.resolve();
    private _onComplete: (root: Asset) => void;
    private _ignore: AssetIgnore;
    private _assetSettingsData: AssetSettings[];
    private _assetCacheData: Record<string, CachedAsset> | undefined | null;
    private _initialised = false;

    constructor(options: AssetWatcherOptions)
    {
        const entryPath = options.entryPath;

        this._onUpdate = options.onUpdate;
        this._onComplete = options.onComplete;
        this._entryPath = entryPath;

        this._ignore = new AssetIgnore({
            ignore: options.ignore as string[] ?? [],
            entryPath
        });

        this._assetCacheData = options.assetCacheData;
        this._assetSettingsData = options.assetSettingsData ?? [];
    }

    private _init()
    {
        if (this._initialised) return;
        this._initialised = true;

        Logger.report({
            type: 'buildStart',
            message: this._entryPath,
        });

        const asset = new Asset({
            path: this._entryPath,
            isFolder: true,
        });

        this._assetHash[asset.path] = asset;

        this._root = asset;

        this._collectAssets(asset);

        if (this._assetCacheData)
        {
            // now compare the cached asset with the current asset
            syncAssetsWithCache(this._assetHash, this._assetCacheData);
        }
    }

    async run()
    {
        this._init();

        return this._runUpdate();
    }

    async watch()
    {
        let firstRun = !this._initialised;

        this._init();

        return new Promise<void>((resolve) =>
        {
            this._watcher = chokidar.watch(this._entryPath, {
            // should we ignore the file based on the ignore rules provided (if any)
            // ignored: this.config.ignore,
                ignored: [(s: string) => s.includes('DS_Store')],
            });

            this._watcher.on('all', (type: any, file: string) =>
            {
                if (!file || this._ignore.shouldIgnore(file)) return;

                this._changes.push({
                    type,
                    file,
                });

                if (this._timeoutId)
                {
                    clearTimeout(this._timeoutId);
                }

                this._timeoutId = setTimeout(() =>
                {
                    this._updateAssets();
                    this._timeoutId = undefined;

                    if (firstRun)
                    {
                        firstRun = false;
                        this._updatingPromise.then(() =>
                        {
                            resolve();
                        });
                    }
                }, 500);
            });
        });
    }

    async stop()
    {
        if (this._watcher)
        {
            this._watcher.close();
        }

        if (this._timeoutId)
        {
            clearTimeout(this._timeoutId);

            this._updateAssets();
            this._timeoutId = undefined;
        }

        await this._updatingPromise;
    }

    private async _runUpdate()
    {
        return this._onUpdate(this._root).then(() =>
        {
            this._cleanAssets(this._root);
            this._onComplete(this._root);
        });
    }

    private async _updateAssets(force = false)
    {
        // wait for current thing to finish..
        await this._updatingPromise;

        if (force || this._changes.length === 0) return;

        this._applyChangeToAssets(this._changes);
        this._changes = [];

        //  logAssetGraph(this._root);
        this._updatingPromise = this._runUpdate();
    }

    private _applyChangeToAssets(changes: ChangeData[])
    {
        changes.forEach(({ type, file }) =>
        {
            let asset = this._assetHash[file];

            if (type === 'unlink' || type === 'unlinkDir')
            {
                asset.state = 'deleted';
            }
            else if (type === 'addDir' || type === 'add')
            {
                if (this._assetHash[file])
                {
                    return;
                }

                // ensure folders...
                this._ensureDirectory(file);

                asset = new Asset({
                    path: file,
                    isFolder: type === 'addDir'
                });

                asset.state = 'added';

                // if asset is added...
                applySettingToAsset(asset, this._assetSettingsData, this._entryPath);

                this._assetHash[file] = asset;

                const parentAsset = this._assetHash[path.dirname(file)];

                parentAsset.addChild(asset);
            }
            else if (asset.state === 'normal')
            {
                asset.state = 'modified';
            }

            // flag all folders as modified..
            asset.markParentAsModified(asset);
        });
    }

    private _cleanAssets(asset: Asset)
    {
        const toDelete: Asset[] = [];

        this._cleanAssetsRec(asset, toDelete);

        toDelete.forEach((asset) =>
        {
            asset.parent?.removeChild(asset);
        });
    }

    private _cleanAssetsRec(asset: Asset, toDelete: Asset[])
    {
        if (asset.state === 'normal') return;

        // TODO is slice a good thing here?
        asset.children.forEach((child) =>
        {
            this._cleanAssetsRec(child, toDelete);
        });

        if (asset.state === 'deleted')
        {
            toDelete.push(asset);

            delete this._assetHash[asset.path];
        }
        else
        {
            asset.state = 'normal';
        }
    }

    private _collectAssets(asset: Asset)
    {
        // loop through and turn each file and folder into an asset
        const files = fs.readdirSync(asset.path);

        files.forEach((file) =>
        {
            const fullPath = path.joinSafe(asset.path, file);

            if (fullPath.includes('DS_Store')) return;

            const stat = fs.statSync(fullPath);

            const childAsset = new Asset({
                path: fullPath,
                isFolder: stat.isDirectory()
            });

            if (!childAsset.metaData.ignore && this._ignore.shouldInclude(childAsset.path))
            {
                this._assetHash[childAsset.path] = childAsset;

                // if asset is added...
                applySettingToAsset(childAsset, this._assetSettingsData, this._entryPath);

                asset.addChild(childAsset);

                if (childAsset.isFolder)
                {
                    this._collectAssets(childAsset);
                }
            }
        });
    }

    private _ensureDirectory(dirPath: string)
    {
        const parentPath = path.dirname(dirPath);

        if (parentPath === this._entryPath || parentPath === '.')
        {
            return;
        }

        this._ensureDirectory(parentPath);

        if (this._assetHash[parentPath])
        {
            return;
        }

        const asset = new Asset({
            path: parentPath,
            isFolder: true
        });

        asset.state = 'added';

        const parentAsset = this._assetHash[path.dirname(parentPath)];

        parentAsset.addChild(asset);

        this._assetHash[parentPath] = asset;
    }
}

