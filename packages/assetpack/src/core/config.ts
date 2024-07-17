import type { LogLevelKeys } from './logger/logLevel.js';
import type { AssetPipe } from './pipes/AssetPipe.js';
import type { AssetSettings } from './pipes/PipeSystem.js';

export interface AssetPackConfig
{
    /** the entry point of assetpack, the folder that will be converted */
    entry?: string;
    /** the output, the converted transformed folder will be here */
    output?: string;
    /**
      * an optional array of ignore patterns. Any file path matching the patterns will not be processed by assetpack
      * they can be globs to.
      */
    ignore?: string[];
    /**
      * If true cached tree will be used
      */
    cache?: boolean;
    cacheLocation?: string;
    logLevel?: LogLevelKeys;
    pipes?: (AssetPipe | AssetPipe[])[];
    assetSettings?: AssetSettings[];
}

