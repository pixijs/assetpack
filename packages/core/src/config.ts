import type { LogLevels } from './logger/logLevel';
import type { Plugin } from './Plugin';

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
      * @defaultValue true
      */
    cache?: boolean;
    logLevel?: keyof typeof LogLevels;
    plugins?: Record<string, Plugin>
    files?: Array<{
        files: string[],
        settings: Record<string, any>
        tags: Array<string | { name: string, data: any }>
    }>
}

export type ReqAssetPackConfig = Required<AssetPackConfig>;

export const defaultConfig: AssetPackConfig = {
    entry: './static',
    output: './dist',
    ignore: [],
    cache: true,
    logLevel: 'info',
    plugins: {},
    files: []
};
