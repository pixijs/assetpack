import type { RootTree, TransformedTree } from './Assetpack';
import type { Processor } from './Processor';

export interface Plugin<T = Record<string, any>>
{
    /** Whether the process runs on a folder */
    folder: boolean;

    /**
     * Called once at the start.
     * @param tree -
     * @param processor - Processor that called the function.
     */
    start?(tree: RootTree, processor: Processor): void

    /**
     * Called when tree is marked for deletion.
     * @param tree -
     * @param processor - Processor that called the function.
     */
    delete?(tree: RootTree, processor: Processor, options: T): Promise<void>

    /**
     * Returns a boolean on whether or not the process should affect this tree.
     * @param tree - Tree to be tested.
     * @returns By defaults returns false.
     */
    test(tree: RootTree | TransformedTree, processor: Processor, options: T): boolean

    /**
     *
     * @param tree -
     * @param processor - Processor that called the function.
     */
    transform?(tree: RootTree, processor: Processor, options: T): Promise<void>

    /**
     * If test is passed then this is called.
     * @param tree -
     * @param processor - Processor that called the function.
     */
    post?(tree: TransformedTree, processor: Processor, options: T): Promise<void>

    /**
     * Called once after tree has been processed.
     * @param tree -
     * @param processor - Processor that called the function.
     */
    finish?(tree: RootTree, processor: Processor): void
}
