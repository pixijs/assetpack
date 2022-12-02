import { Runner } from '@pixi/runner';
import { copySync, existsSync, outputFileSync, removeSync } from 'fs-extra';
import merge from 'merge';
import minimatch from 'minimatch';
import type { RootTree, Tags, TransformedTree } from './Assetpack';
import { Logger } from './logger/Logger';
import type { Plugin } from './Plugin';
import type { ReqAssetpackConfig } from './rc';
import { hasTag, replaceExt } from './utils';

export class Processor
{
    private readonly _config: ReqAssetpackConfig;
    private _pluginMap: Map<Plugin, string> = new Map();
    /** Array of processes to be called */
    private readonly processes: Plugin[] = [];
    /**  A runner that calls the start function of a process */
    private readonly onStart: Runner = new Runner('start');
    /** A runner that calls the finish function of a process */
    private readonly onFinish: Runner = new Runner('finish');
    /** Time a tree was modified */
    private modifiedTime = 0;

    private transformHash: Record<string, TransformedTree[] | null> = {};
    private hash: Record<string, RootTree> = {};

    constructor(config: ReqAssetpackConfig)
    {
        this._config = config;
    }

    public addPlugin(plugin: Plugin, key: string): void
    {
        this._pluginMap.set(plugin, key);
        this.processes.push(plugin);
        this.onStart.add(plugin);
        this.onFinish.add(plugin);
    }

    public async run(tree: RootTree): Promise<void>
    {
        this.modifiedTime = Date.now();

        tree.state = 'modified';

        // step 1: first let all processes know that we have begun..
        // this gets called ONCE for each process
        this.onStart.emit(tree, this);

        // step 2: run all processes
        // this loops through and deletes any output files
        // that have been deleted from input folder
        await Promise.allSettled(this._cleanTree(tree));

        // step 3: next we transform our files
        // this is where one file can become another (or multiple!)
        // eg tps folder becomes a json + png file
        // all transformed files are attached to the tree node as an array
        // call 'transformed'
        // if there is no transform for a particular item then the
        // file is simply copied and stored in the transformed
        await Promise.allSettled(this._transformTree(tree));
    }

    public inputToOutput(inputPath: string, extension?: string): string
    {
        const targetPath = inputPath.replace(/{(.*?)}/g, '');

        let output = targetPath.replace(this._config.entry, this._config.output);

        if (extension)
        {
            output = replaceExt(output, extension);
        }

        return output;
    }

    public addToTreeAndSave(data: {
        tree: RootTree;
        outputOptions?: {
            outputExtension?: string;
            outputPathOverride?: string;
            outputData?: any;
        },
        transformOptions?: {
            isFolder?: boolean,
            fileTags?: Tags,
            transformId?: string
            transformData?: Record<string, string>
        },
    })
    {
        const outputName = data.outputOptions?.outputPathOverride
        ?? this.inputToOutput(data.tree.path, data.outputOptions?.outputExtension);

        this.addToTree({
            tree: data.tree,
            outputOptions: {
                outputPathOverride: outputName,
            },
            ...data.transformOptions
        });

        this.saveToOutput({
            tree: data.tree,
            outputOptions: {
                outputPathOverride: outputName,
                outputData: data.outputOptions?.outputData,
            },
        });
    }

    public saveToOutput(data: {
        tree: RootTree;
        outputOptions?: {
            outputExtension?: string;
            outputPathOverride?: string;
            outputData?: any;
        },
    })
    {
        const outputName = data.outputOptions?.outputPathOverride
            ?? this.inputToOutput(data.tree.path, data.outputOptions?.outputExtension);

        if (!data.outputOptions?.outputData)
        {
            copySync(data.tree.path, outputName);
            Logger.verbose(`[processor] File Copied: ${outputName}`);

            return outputName;
        }

        outputFileSync(outputName, data.outputOptions.outputData);
        Logger.verbose(`[processor] File Saved: ${outputName}`);

        return outputName;
    }

    /**
     * Adds files that have been transformed into the tree.
     *
     * @param data.outputName - Path of the file.
     * @param data.tree - Tree that will have transformed files added too.
     * @param data.isFolder - Whether transformed file is a folder.
     * @param data.fileTags - Tags that are associated with the folder.
     * @param data.transformId - Unique id for the transformed file.
     * @param data.transformData - any optional data you want to pass in with the transform.
     */
    public addToTree(data: {
        tree: RootTree,
        outputOptions?: {
            outputExtension?: string;
            outputPathOverride?: string;
        },
        isFolder?: boolean,
        fileTags?: Tags,
        transformId?: string
        transformData?: Record<string, string>
    }): void
    {
        // eslint-disable-next-line prefer-const
        let { tree, isFolder, fileTags, transformId, transformData } = data;

        const outputName = data.outputOptions?.outputPathOverride
            ?? this.inputToOutput(data.tree.path, data.outputOptions?.outputExtension);

        if (!tree.transformed)
        {
            tree.transformed = [];
        }

        isFolder = isFolder ?? tree.isFolder;
        fileTags = { ...tree.fileTags, ...fileTags };

        tree.transformed.push({
            path: outputName,
            isFolder,
            creator: tree.path,
            time: this.modifiedTime,
            fileTags,
            pathTags: tree.pathTags,
            transformId: transformId ?? null,
            transformData: transformData || {},
        });
    }

    /**
     * Recursively checks for the deleted state of the files in a tree.
     * If found then its removed from the tree and process.delete() is called.
     * @param tree - Tree to be processed.
     * @param promises - Array of plugin.delete promises to be returned.
     */
    private _cleanTree(tree: RootTree, promises: Promise<void>[] = []): Promise<void>[]
    {
        for (const i in tree.files)
        {
            this._cleanTree(tree.files[i], promises);
        }

        if (tree.state === 'deleted')
        {
            for (let j = 0; j < this.processes.length; j++)
            {
                const process = this.processes[j];

                if (
                    process.delete
                    && !hasTag(tree, 'path', 'ignore')
                    && process.test(tree, this, this.getOptions(tree.path))
                )
                {
                    promises.push(process.delete(tree, this, this.getOptions(tree.path)));
                }
            }

            const transformed = tree.transformed;

            if (transformed)
            {
                transformed.forEach((out: TransformedTree) =>
                {
                    removeSync(out.path);
                });

                this.transformHash[tree.path] = null;
            }
        }

        return promises;
    }

    /**
     * Recursively loops through a tree and called the transform function on a process if the tree was added or modified
     * @param tree - Tree to be processed
     * @param promises - Array of plugin.transform promises to be returned.
     */
    private _transformTree(tree: RootTree, promises: Promise<void>[] = []): Promise<void>[]
    {
        let stopProcessing = false;
        let transformed = false;

        // first apply transforms / copy to other place..
        if (tree.state === 'modified' || tree.state === 'added')
        {
            if (tree.path && !existsSync(tree.path))
            {
                Logger.error(
                    `[processor] Asset ${tree.path} does not exist. Could have been deleted half way through processing.`
                );

                return promises;
            }

            for (let j = 0; j < this.processes.length; j++)
            {
                const process = this.processes[j];

                if (
                    process.transform
                    && !hasTag(tree, 'path', 'ignore')
                    && process.test(tree, this, this.getOptions(tree.path))
                )
                {
                    transformed = true;

                    promises.push(process.transform(tree, this, this.getOptions(tree.path)));

                    if (process.folder)
                    {
                        stopProcessing = true;
                    }
                }
            }

            // if tree.path is nul the this is the root..
            if (!transformed)
            {
                if (!tree.isFolder)
                {
                    this.addToTreeAndSave({ tree });
                }
                else
                {
                    this.addToTree({ tree });
                }
            }
        }

        this.hash[tree.path] = tree;

        if (tree.transformed.length > 0)
        {
            this.transformHash[tree.path] = tree.transformed;
        }
        else
        {
            tree.transformed = this.transformHash[tree.path] || [];
        }

        if (stopProcessing) return promises;

        for (const i in tree.files)
        {
            this._transformTree(tree.files[i], promises);
        }

        return promises;
    }

    private getOptions(file: string)
    {
        let options = {};

        // walk through the config.files and see if we have a match..
        for (const i in this._config.files)
        {
            const fileConfig = this._config.files[i];

            // use minimatch to see if we have a match on any item in the files array
            const match = fileConfig.files.some((item: string) => minimatch(file, item));

            if (match)
            {
                options = merge.recursive(options, fileConfig.settings);
            }
        }

        return options;
    }
}
