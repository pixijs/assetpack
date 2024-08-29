import { finalCopyPipe } from './finalCopyPipe.js';
import { mergePipeOptions } from './mergePipeOptions.js';
import { multiPipe } from './multiPipe.js';

import type { Asset } from '../Asset.js';
import type { AssetPipe } from './AssetPipe.js';

export interface PipeSystemOptions
{
    pipes: (AssetPipe | AssetPipe[])[];
    outputPath: string;
    entryPath: string;
}

export interface AssetSettings
{
    files: string[],
    settings?: Record<string, any>,
    metaData?: Record<string, any>
}

export class PipeSystem
{
    pipes: AssetPipe[] = [];
    pipeHash: Record<string, AssetPipe> = {};
    outputPath: string;
    entryPath: string;

    assetSettings: AssetSettings[] = [];

    internalMetaData: Record<string, any> = {
        copy: 'copy',
        ignore: 'ignore',
    };

    constructor(options: PipeSystemOptions)
    {
        const pipes = [];

        for (let i = 0; i < options.pipes.length; i++)
        {
            const pipe = options.pipes[i];

            if (Array.isArray(pipe))
            {
                pipes.push(multiPipe({ pipes: pipe }));
            }
            else
            {
                pipes.push(pipe);
            }
        }

        options.pipes.flat().forEach((pipe) =>
        {
            this.pipeHash[pipe.name] = pipe;
            this.internalMetaData = { ...this.internalMetaData, ...Object.values(pipe.internalTags ?? pipe.tags ?? {}).reduce((acc, tag) => ({ ...acc, [tag]: true }), {}) };
        });

        this.pipes = pipes;

        this.outputPath = options.outputPath;
        this.entryPath = options.entryPath;
    }

    async transform(asset: Asset): Promise<void>
    {
        await this._transform(asset, 0);
    }

    private async _transform(asset: Asset, pipeIndex = 0): Promise<void>
    {
        if (pipeIndex >= this.pipes.length)
        {
            return;
        }

        const pipe = this.pipes[pipeIndex]!;

        pipeIndex++;

        // if the asset has the copy tag on it, then the only pipe that should be run is the final copy pipe
        // this is to ensure that the asset is copied to the output directory without any other processing
        if (asset.allMetaData.copy && pipe !== finalCopyPipe)
        {
            await this._transform(asset, this.pipes.length - 1);

            return;
        }

        const options = mergePipeOptions(pipe, asset);

        if (options !== false && pipe.transform && pipe.test?.(asset, options))
        {
            asset.transformName = pipe.name;
            asset.transformChildren = [];

            const assets = await pipe.transform(asset, options, this);

            const promises: Promise<void>[] = [];

            for (const transformAsset of assets)
            {
                if (asset !== transformAsset)
                {
                    asset.addTransformChild(transformAsset);
                }

                promises.push(this._transform(transformAsset, pipeIndex)); // Await the recursive transform call
            }

            await Promise.all(promises);
        }
        else
        {
            await this._transform(asset, pipeIndex);
        }
    }

    async start(rootAsset: Asset)
    {
        for (let i = 0; i < this.pipes.length; i++)
        {
            const pipe = this.pipes[i];

            if (pipe.start)
            {
                await pipe.start(rootAsset, pipe.defaultOptions, this);
            }
        }
    }

    async finish(rootAsset: Asset)
    {
        for (let i = 0; i < this.pipes.length; i++)
        {
            const pipe = this.pipes[i];

            if (pipe.finish)
            {
                await pipe.finish(rootAsset, pipe.defaultOptions, this);
            }
        }
    }

    getPipe(name: string): AssetPipe
    {
        return this.pipeHash[name];
    }
}

