import { merge } from '../utils/merge.js';

import type { Asset } from '../Asset.js';
import type { AssetPipe, PluginOptions } from './AssetPipe.js';

export function mergePipeOptions<T extends PluginOptions>(pipe: AssetPipe<T>, asset: Asset): T | false
{
    if (!asset.settings) return pipe.defaultOptions;

    const pipeSettings = asset.settings[pipe.name];

    if (pipeSettings === false) return false;

    return merge.recursive(pipe.defaultOptions, pipeSettings ?? {});
}
