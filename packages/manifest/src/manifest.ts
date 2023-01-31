import type { ChildTree, Plugin, Processor, RootTree } from '@assetpack/core';
import { writeJSONSync } from 'fs-extra';

export interface BaseManifestOptions
{
    output?: string;
    defaultParser: { type: 'copy', parser: (tree: ChildTree, processor: Processor) => any[] };
    parsers?: { type: string, parser: (tree: ChildTree, processor: Processor) => any[] }[]
}

export type Finish<T> = (plugin: Plugin<T>, tree: RootTree, processor: Processor, options: T) => any;

export function baseManifest<T extends BaseManifestOptions>(func: Finish<T>, options: T): Plugin<T>
{
    const defaultOptions: T = {
        parsers: [options.defaultParser, ...options?.parsers || []],
    } as T;

    let dirty = true;

    return {
        folder: false,
        test(tree: RootTree)
        {
            if (!tree.state) return false;
            if (tree.state === 'added' || tree.state === 'deleted')
            {
                dirty = true;
            }

            // so we now only care if anything was added or removed, we don't care if it was modified!
            return false;
        },
        async delete()
        {
            dirty = true;
        },
        finish(tree, processor)
        {
            if (!dirty) return;

            dirty = false;

            // write to disk
            writeJSONSync(
                `${defaultOptions?.output || processor.config.output}/manifest.json`,
                func(this, tree, processor, defaultOptions),
                { spaces: 2 }
            );
        },
    };
}
