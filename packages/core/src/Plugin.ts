export interface Plugin<T>
{
    /** Whether the process runs on a folder */
    folder: boolean;

    /**
     * Called once at the start.
     * @param tree -
     * @param processor - Processor that called the function.
     */
    start(tree: ITree, processor: Processor, options: T): void

    /**
     * Called when tree is marked for deletion.
     * @param tree -
     * @param processor - Processor that called the function.
     */
    delete(tree: ITree, processor: Processor, options: T): Promise<void>

    /**
     * Returns a boolean on whether or not the process should affect this tree.
     * @param tree - Tree to be tested.
     * @returns By defaults returns false.
     */
    test(tree: ITree | ITransformed, processor: Processor, options: T): boolean

    /**
     *
     * @param tree -
     * @param processor - Processor that called the function.
     */
    transform(tree: ITree, processor: Processor, options: T): Promise<void>

    /**
     * If test is passed then this is called.
     * @param tree -
     * @param processor - Processor that called the function.
     */
    post(tree: ITransformed, processor: Processor, options: T): Promise<void>

    /**
     * Called once after tree has been processed.
     * @param tree -
     * @param processor - Processor that called the function.
     */
    finish(tree: ITree, processor: Processor, options: T): void
}
