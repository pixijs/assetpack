import type { LogLevels } from './logger/logLevel';
import type { Plugin } from './Plugin';

export interface AssetpackConfig
{
    /** the entry point of bulldog, the folder that will be converted */
    entry?: string;
    /** the output, the converted transformed folder will be here */
    output?: string;
    /**
      * an optional array of ignore patterns. Any file path matching the patterns will not be processed by bulldog
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

export type ReqAssetpackConfig = Required<AssetpackConfig>;

export const defaultConfig: AssetpackConfig = {
    entry: './static',
    output: './dist',
    ignore: [],
    cache: true,
    logLevel: 'info',
    plugins: {},
    files: []
};
