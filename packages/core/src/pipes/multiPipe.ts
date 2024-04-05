import type { Asset } from '../Asset';
import type { AssetPipe } from './AssetPipe';
import type { PipeSystem } from './PipeSystem';
import { mergePipeOptions } from './mergePipeOptions';

export interface MultiPipeOptions
{
    pipes: AssetPipe[];
    name?: string;
}

let nameIndex = 0;

export function multiPipe(options: MultiPipeOptions): AssetPipe<MultiPipeOptions>
{
    const pipes = options.pipes.slice();

    return {
        name: options.name ?? `multi-pipe-${++nameIndex}`,
        folder: false,
        defaultOptions: options,
        test(asset: Asset)
        {
            for (let i = 0; i < pipes.length; i++)
            {
                const pipe: AssetPipe = pipes[i] as AssetPipe;

                const options = mergePipeOptions(pipe, asset);

                if (pipe.transform && pipe.test && pipe.test(asset, options))
                {
                    return true;
                }
            }

            return false;
        },
        async transform(asset: Asset, _options, pipeSystem: PipeSystem)
        {
            const promises: Promise<Asset[]>[] = [];

            for (let i = 0; i < pipes.length; i++)
            {
                const pipe: AssetPipe = pipes[i] as AssetPipe;

                const options = mergePipeOptions(pipe, asset);

                if (pipe.transform && pipe.test && pipe.test(asset, options))
                {
                    promises.push(pipe.transform(asset, options, pipeSystem));
                }
            }

            const allAssets = await Promise.all(promises);

            return allAssets.flat();
        }
    };
}

