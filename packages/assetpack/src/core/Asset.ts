import fs from 'fs-extra';
import { Logger } from './logger/Logger.js';
import { extractTagsFromFileName } from './utils/extractTagsFromFileName.js';
import { getHash } from './utils/getHash.js';
import { path } from './utils/path.js';

import type { CachedAsset } from './AssetCache.js';

export interface AssetOptions
{
    path: string;
    transformName?: string;
    isFolder?: boolean;
}

export class Asset
{
    private _defaultOptions: AssetOptions = {
        path: '',
        isFolder: false,
    };

    // file based..
    parent: Asset | null = null;
    children: Asset[] = [];

    // transform based..
    transformParent: Asset | null = null;
    transformChildren: Asset[] = [];

    transformName: string | null = null;

    metaData: Record<string, any> = {};
    inheritedMetaData: Record<string, any> = {};
    transformData: Record<string, any> = {};

    settings?: Record<string, any>;

    isFolder: boolean;
    path = '';
    skip = false;

    private _state: 'deleted' | 'added' | 'modified' | 'normal' = 'added';
    private _buffer?: Buffer | null = null;

    private _hash?: string;

    constructor(options: AssetOptions)
    {
        options = { ...this._defaultOptions, ...options };

        this.path = options.path;
        this.isFolder = options.isFolder as boolean;
        this.transformName = options.transformName || null;

        // extract tags from the path
        extractTagsFromFileName(this.filename, this.metaData);
    }

    addChild(asset: Asset)
    {
        this.children.push(asset);

        asset.parent = this;

        asset.inheritedMetaData = { ...this.inheritedMetaData, ...this.metaData };
        asset.transformData = { ...this.transformData, ...asset.transformData };
    }

    removeChild(asset: Asset)
    {
        const index = this.children.indexOf(asset);

        if (index !== -1)
        {
            this.children.splice(index, 1);
            asset.parent = null;
        }

        asset.releaseChildrenBuffers();
    }

    addTransformChild(asset: Asset)
    {
        this.transformChildren.push(asset);

        asset.transformParent = this;

        asset.inheritedMetaData = { ...this.inheritedMetaData, ...this.metaData };
        asset.transformData = { ...this.transformData, ...asset.transformData };

        asset.settings = this.settings;
    }

    get allMetaData()
    {
        return { ...this.inheritedMetaData, ...this.metaData };
    }

    get state()
    {
        return this._state;
    }

    set state(value)
    {
        if (this._state === value) return;
        this._state = value;

        this._hash = undefined;
    }

    get buffer(): Buffer
    {
        if (this.isFolder)
        {
            Logger.warn('[AssetPack] folders should not have buffers!. Contact the developer of AssetPack');
        }

        if (!this._buffer)
        {
            this._buffer = fs.readFileSync(this.path);
        }

        return this._buffer;
    }

    set buffer(value: Buffer | null)
    {
        this._buffer = value;

        this._hash = undefined;
    }

    get hash()
    {
        if (this.isFolder)
        {
            Logger.warn('[AssetPack] folders should not have hashes. Contact the developer of the AssetPack');
        }

        this._hash ??= getHash(this.buffer);

        return this._hash;
    }

    get filename()
    {
        return path.basename(this.path);
    }

    get directory()
    {
        return path.dirname(this.path);
    }

    get extension()
    {
        return path.extname(this.path);
    }

    get rootAsset()
    {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let asset: Asset = this;

        while (asset.parent)
        {
            asset = asset.parent;
        }

        return asset;
    }

    get rootTransformAsset()
    {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let asset: Asset = this;

        while (asset.transformParent)
        {
            asset = asset.transformParent;
        }

        return asset;
    }

    skipChildren()
    {
        for (let i = 0; i < this.children.length; i++)
        {
            const child = this.children[i];

            child.skip = true;
            child.skipChildren();
        }
    }

    getFinalTransformedChildren(asset: Asset = this, finalChildren: Asset[] = []): Asset[]
    {
        if (asset.transformChildren.length > 0)
        {
            for (let i = 0; i < asset.transformChildren.length; i++)
            {
                const child = asset.transformChildren[i];

                this.getFinalTransformedChildren(child, finalChildren);
            }
        }
        else
        {
            finalChildren.push(asset);
        }

        return finalChildren;
    }

    markParentAsModified(asset: Asset = this)
    {
        const parent = asset.parent;

        if (parent)
        {
            if (parent.state === 'normal')
            {
                parent.state = 'modified';
            }

            this.markParentAsModified(parent);
        }
    }

    /**
     * Release all buffers from this asset and its transformed children
     * this is to make sure we don't hold onto buffers that are no longer needed!
     */
    releaseBuffers()
    {
        this.buffer = null;

        for (let i = 0; i < this.transformChildren.length; i++)
        {
            this.transformChildren[i].releaseBuffers();
        }
    }

    /**
     * Release all buffers from this asset and its children
     */
    releaseChildrenBuffers()
    {
        this.releaseBuffers();
        for (let i = 0; i < this.children.length; i++)
        {
            this.children[i].releaseChildrenBuffers();
        }
    }

    /**
     * Get the public meta data for this asset
     * This will exclude any internal data
     */
    getPublicMetaData(internalPipeData: Record<string, any>)
    {
        const internalKeys = new Set(Object.keys(internalPipeData));
        const metaData = Object.keys(this.allMetaData).reduce((result: Record<string, any>, key) =>
        {
            if (!internalKeys.has(key))
            {
                result[key] = this.allMetaData[key];
            }

            return result;
        }, {} as Record<string, any>);

        return metaData;
    }

    getInternalMetaData(internalPipeData: Record<string, any>)
    {
        const res: Record<string, any> = {};

        Object.keys(internalPipeData).forEach((key) =>
        {
            if (this.allMetaData[key])
            {
                res[key] = this.allMetaData[key];
            }
        });

        return res;
    }

    toCacheData(saveHash: boolean): CachedAsset
    {
        const data: CachedAsset = {
            isFolder: this.isFolder,
            parent: this.parent?.path,
            transformParent: this.transformParent?.path,
            metaData: { ...this.metaData },
            inheritedMetaData: { ...this.inheritedMetaData },
            transformData: { ...this.transformData }
        };

        if (!this.isFolder && saveHash)
        {
            data.hash = this.hash;
        }

        return data;
    }
}

