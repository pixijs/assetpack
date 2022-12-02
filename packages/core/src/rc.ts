import type { LogLevels } from './logger/logLevel';

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
    logLevel?: LogLevels;
    plugins?: Record<string, Plugin>
    files?: Array<{
        files: string[],
        tags: Array<string | { name: string, data: any }>
    }>
}
