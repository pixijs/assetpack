import type { Asset } from '../Asset';
import type { AssetPipe } from './AssetPipe';

export function mergePipeOptions<T>(pipe: AssetPipe<T>, asset: Asset): T
{
    if (!asset.settings) return pipe.defaultOptions;

    return { ...pipe.defaultOptions, ...asset.settings };
}
