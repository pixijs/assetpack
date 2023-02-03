import clone from 'clone';
import fs from 'fs-extra';
import merge from 'merge';
import minimatch from 'minimatch';
import hash from 'object-hash';
import path from 'upath';
import type { AssetPackConfig, ReqAssetPackConfig } from './config';
import { defaultConfig } from './config';
import { Logger } from './logger/Logger';
import { Processor } from './Processor';

export interface Tags
{
    [x: string]: boolean | Array<any> | Record<string, any>
}

export interface RootTree
{
    fileTags: Tags;
    pathTags: Tags;
    files: {[x: string]: ChildTree};
    isFolder: boolean;
    parent: string | null;
    path: string;
    state: 'added' | 'deleted' | 'modified' | 'normal';
    transformed: TransformedTree[];
}

export interface ChildTree extends RootTree
{
    time: number;
}

export interface TransformedTree extends Omit<RootTree, 'files' | 'parent' | 'transformed' | 'state'>
{
    creator: string;
    time: number;
    transformId: string | null;
    transformData: Record<string, any>;
}

interface CachedTree
{
    signature: string,
    time: number,
    tree: RootTree
}

export class AssetPack
{
    public readonly config: ReqAssetPackConfig;
    /** A hash of all tree nodes */
    private _treeHash: Record<string, ChildTree> = {};
    /** A hash of file locations to be ignored */
    private _ignoreHash: {[x: string]: boolean} = {};
    /** The current tree */
    private _tree: RootTree = {} as RootTree;
    /** The cached tree */
    private _cachedTree: RootTree = {} as RootTree;
    /** Path to store the cached tree */
    private readonly _cacheTreePath: string;
    /**  Manages processes and changes in assets */
    private readonly _processor: Processor;
    /** A signature to identify the cache */
    private _signature: string;

    constructor(config: AssetPackConfig)
    {
        // TODO validate config
        this.config = merge.recursive(true, defaultConfig, config) as ReqAssetPackConfig;
        this.config.entry = path.normalizeSafe(this.config.entry);
        this.config.output = path.normalizeSafe(this.config.output);

        this._processor = new Processor(this.config);
        Logger.init(this.config);

        // create .assetpack folder if it doesn't exist
        fs.ensureDirSync('.assetpack/');

        // creates a file name that is valid for windows and mac
        const folderTag = (`${this.config.entry}-${this.config.output}`).split('/').join('-');

        this._cacheTreePath = `.assetpack/${folderTag}}`;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { plugins, ...configWithoutPlugins } = this.config;

        this._signature = hash(configWithoutPlugins);

        this._addPlugins();
    }

    private _addPlugins()
    {
        const { plugins } = this.config;

        if (plugins)
        {
            Object.keys(plugins).forEach((name) =>
            {
                this._signature += name;
                this._processor.addPlugin(plugins[name], name);
            });
        }
    }

    public async run()
    {
        this._loadTree();
        this._walk(this.config.entry, this._tree);
        this._compareChanges(this._cachedTree, this._tree);

        await this._processor.run(this._tree);

        this._removeDeletesFromTree(this._tree);

        if (this.config.cache)
        {
            const cacheData: CachedTree = {
                signature: this._signature,
                time: new Date().getTime() + 5000,
                tree: this._tree
            };

            fs.outputFileSync(this._cacheTreePath, JSON.stringify(cacheData, null, 4));
        }

        this._cachedTree = this._tree;
    }

    private _walk(dir: string, branch: RootTree)
    {
        const files = fs.readdirSync(dir);

        files.forEach((file) =>
        {
            if (file.indexOf('.DS_Store') !== -1) return;

            const fullPath = path.joinSafe(dir, file);
            const base = this.config.entry;
            const relativePath = fullPath.replace(base, '');

            // should we ignore the file based on the ignore rules provided (if any)
            if (this._shouldIgnore(relativePath)) return;

            const fileTags = this._extractTags(path.normalizeSafe(file));
            const pathTags = this._extractTags(fullPath);
            const stat = fs.statSync(fullPath);
            const child: ChildTree = {
                isFolder: stat.isDirectory(),
                parent: branch.path,
                time: stat.mtimeMs,
                fileTags,
                pathTags,
                path: fullPath, // this full file path of the input
                state: 'normal',
                files: {},
                transformed: []
            };

            this._treeHash[child.path] = child;

            if (!branch.files)
            {
                branch.files = {};
            }

            branch.files[fullPath] = child;

            if (child.isFolder)
            {
                this._walk(fullPath, child);
            }
        });
    }

    /**
     * Compares changes between two trees
     * @param tree1 - Tree to be compared
     * @param tree2 - Tree to be compared
     */
    private _compareChanges(tree1: RootTree | null, tree2: RootTree): void
    {
        if (!tree1)
        {
            tree2.state = 'added';

            this._markDirty(tree2);
        }
        else
        {
            for (const i in tree1.files)
            {
                if (!tree2.files[i])
                {
                    tree2.files[i] = clone(tree1.files[i]);

                    this._markAsDeleted(tree2.files[i]);

                    tree2.state = 'modified';

                    this._markDirty(tree2);
                }
                else if (tree2.files[i].time !== tree1.files[i].time)
                {
                    tree2.files[i].state = 'modified';
                    this._markDirty(tree2.files[i]);
                }
                else
                {
                    // same..
                    tree2.files[i].transformed = clone(tree1.files[i].transformed);
                }
            }
        }

        for (const i in tree2.files)
        {
            if (tree2.files[i].state !== 'deleted')
            {
                this._compareChanges((tree1?.files) ? tree1.files[i] : null, tree2.files[i]);
            }
        }
    }

    private _loadTree()
    {
        if (Object.keys(this._cachedTree).length === 0 && this.config.cache)
        {
            try
            {
                fs.ensureDirSync(this.config.output);

                const json = fs.readFileSync(this._cacheTreePath, 'utf8');

                const parsedJson = JSON.parse(json) as CachedTree;

                if (parsedJson.signature === this._signature)
                {
                    Logger.info('Cache found.');

                    this._cachedTree = parsedJson.tree;
                }
                else
                {
                    Logger.warn('Cache found, but different setup detected. Ignoring cache and rebuilding to be safe.');
                }
            }
            catch (e)
            {
                Logger.warn('No Cache found.');
            }
        }

        if (!this._cachedTree || Object.keys(this._cachedTree).length === 0)
        {
            Logger.info('Clearing output folder.');
            fs.removeSync(this.config.output);
            fs.ensureDirSync(this.config.output);
        }

        fs.removeSync(this._cacheTreePath);

        this._tree = {
            fileTags: {},
            files: {},
            isFolder: true,
            parent: null,
            path: this.config.entry,
            state: 'normal',
            pathTags: {},
            transformed: [],
        };
    }

    /**
     * Determines whether the path should be ignored based on an array of glob patterns
     * @param relativePath - Path to be checked
     * @returns If the path should be ignored
     */
    private _shouldIgnore(relativePath: string): boolean
    {
        if (this.config.ignore.length > 0)
        {
            if (this._ignoreHash[relativePath] === undefined)
            {
                this._ignoreHash[relativePath] = this.config.ignore.reduce((current: boolean, pattern: string) =>
                    current || minimatch(relativePath, pattern), false);
            }

            if (this._ignoreHash[relativePath]) return true;
        }

        return false;
    }

    /**
     * Extracts the tags from the folders name and returns an object with those tags
     * @param fileName - Name of folder
     * @returns An object of tags associated with the folder
     */
    private _extractTags(fileName: string): Tags
    {
        const regEx = /{(.*?)}/g;
        const tagMatches = fileName.match(regEx);

        const values: Tags = {};

        if (tagMatches)
        {
            tagMatches.forEach((i) =>
            {
                const trim = i.substring(1, i.length - 1);

                values[trim] = true;
            });
        }

        // need to loop from the files from the config and see if they have any tags to override
        if (this.config.files)
        {
            this.config.files.forEach((file) =>
            {
                const { tags, files } = file;

                if (!tags) return;

                const found = files.find((f) => minimatch(fileName, f));

                if (found)
                {
                    tags.forEach((key) =>
                    {
                        // check if key is a string
                        if (typeof key === 'string')
                        {
                            values[key] = true;
                        }
                        else
                        {
                            values[key.name] = key.data;
                        }
                    });
                }
            });
        }

        return values;
    }

    /**
     * Modifies the state of the tree to be `modified`
     * @param tree - Tree to be made dirty
     */
    private _markDirty(tree: RootTree): void
    {
        if (!tree.parent) return;

        const parent = this._treeHash[tree.parent];

        if (parent && parent.state === 'normal')
        {
            parent.state = 'modified';

            this._markDirty(parent);
        }
    }

    /**
     * Marks a tree for deletion.
     * @param tree - The tree to be marked as deleted
     */
    private _markAsDeleted(tree: RootTree): void
    {
        tree.state = 'deleted';

        for (const i in tree.files)
        {
            this._markAsDeleted(tree.files[i]);
        }
    }

    /**
     * Removes deleted files from the cached tree.
     * @param tree - Tree that the files will be removed from.
     */
    private _removeDeletesFromTree(tree: RootTree): void
    {
        for (const i in tree.files)
        {
            if (tree.files[i].state === 'deleted')
            {
                delete tree.files[i];
            }
            else
            {
                this._removeDeletesFromTree(tree.files[i]);
            }
        }
    }
}
