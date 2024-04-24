import { extractTagsFromFileName } from './utils/extractTagsFromFileName';
import { getHash } from './utils/getHash';
import fs from 'fs-extra';
import { Logger } from './logger/Logger';
import { path } from './utils/path';

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
    allMetaData: Record<string, any> = {};

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

        asset.allMetaData = { ...asset.inheritedMetaData, ...asset.metaData };
    }

    removeChild(asset: Asset)
    {
        const index = this.children.indexOf(asset);

        if (index !== -1)
        {
            this.children.splice(index, 1);
            asset.parent = null;
        }
    }

    addTransformChild(asset: Asset)
    {
        this.transformChildren.push(asset);

        asset.transformParent = this;

        asset.inheritedMetaData = { ...this.inheritedMetaData, ...this.metaData };

        asset.allMetaData = { ...asset.inheritedMetaData, ...asset.metaData };

        asset.settings = this.settings;
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
            Logger.warn('[Assetpack] folders should not have buffers!. Contact the developer of Assetpack');
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
            Logger.warn('[Assetpack] folders should not have hashes. Contact the developer of the Assetpack');
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
}

