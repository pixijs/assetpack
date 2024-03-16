import type { Asset } from '../Asset';
import type { PipeSystem } from './PipeSystem';

export type NotNull<T> = T extends null | undefined ? never : T;

// eslint-disable-next-line @typescript-eslint/ban-types
type Primitive = undefined | null | boolean | string | number | Function;

export type DeepRequired<T> = T extends Primitive
    ? NotNull<T>
    : {
        [P in keyof T]-?: T[P] extends Array<infer U>
            ? Array<DeepRequired<U>>
            : T[P] extends ReadonlyArray<infer U2>
                ? DeepRequired<U2>
                : DeepRequired<T[P]>
    };
export interface PluginOptions<T extends string>
{
    tags?: Partial<Record<T, string>>;
}

export interface AssetPipe<OPTIONS=Record<string, any>>
{
    /** Whether the process runs on a folder */
    folder?: boolean;

    /** Name of the plugin used to tell the manifest parsers which one to use */
    name: string;

    defaultOptions: OPTIONS;

    /**
     * Called once at the start.
     * @param asser - the root asset
     * @param processor - Processor that called the function.
     */
    start?(asset: Asset, options: DeepRequired<OPTIONS>, pipeSystem: PipeSystem): void

    /**
     * Returns a boolean on whether or not the process should affect this tree.
     * @param asset - Tree to be tested.
     * @returns By defaults returns false.
     */
    test?(asset: Asset, options: DeepRequired<OPTIONS>): boolean;

    /**
     *
     * @param tree -
     * @param processor - Processor that called the function.
     */
    transform?(asset: Asset, options: DeepRequired<OPTIONS>, pipeSystem: PipeSystem): Promise<Asset[]>

    /**
     * Called once after tree has been processed.
     * @param asset - the root asset
     * @param processor - Processor that called the function.
     */
    finish?(asset: Asset, options: DeepRequired<OPTIONS>, pipeSystem: PipeSystem): void
}

