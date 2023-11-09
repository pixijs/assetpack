import type { ChildTree, Plugin, Processor, RootTree, Tags } from '@assetpack/core';
import { path, SavableAssetCache } from '@assetpack/core';
import type { BaseManifestOptions, ManifestParser } from './manifest';
import { baseManifest } from './manifest';
import { getManifestName } from './utils';

export interface PixiManifest
{
    name: string;
    assets: PixiManifestEntry[];
}

export interface PixiManifestEntry
{
    name: string | string[];
    srcs: string | string[];
    data?: {
        tags: Tags;
        [x: string]: any;
    };
}

export interface PixiManifestOptions extends BaseManifestOptions
{
    createShortcuts?: boolean;
    trimExtensions?: boolean;
    ignoreFileExtensions?: string[];
    defaultParser: ManifestParser<'copy', PixiManifestOptions>;
    parsers: ManifestParser<any, PixiManifestOptions>[];
}

export function pixiManifest(options?: Partial<PixiManifestOptions>): Plugin<PixiManifestOptions>
{
    const defaultOptions: PixiManifestOptions = {
        createShortcuts: false,
        trimExtensions: false,
        defaultParser: { type: 'copy', parser: defaultPixiParser },
        parsers: [],
        ...options,
    };
    const plugin = baseManifest<PixiManifestOptions>(finish, defaultOptions);

    return plugin;
}

function finish(
    _plugin: Plugin<PixiManifestOptions>,
    tree: RootTree,
    processor: Processor,
    options: PixiManifestOptions
)
{
    const bundles: Map<string, PixiManifest> = new Map();

    bundles.set('default', {
        name: 'default',
        assets: [],
    });

    collect(tree, processor, bundles, options);

    // only filter out duplicates if we are creating shortcuts or trimming extensions
    if (options.trimExtensions || options.createShortcuts)
    {
        const nameMap = new Map<PixiManifestEntry, string[]>();

        bundles.forEach((bundle) => bundle.assets.forEach((asset) => nameMap.set(asset, asset.name as string[])));

        const arrays = Array.from(nameMap.values());
        const sets = arrays.map((arr) => new Set(arr));
        const uniqueArrays = arrays.map((arr, i) => arr.filter((x) => sets.every((set, j) => j === i || !set.has(x))));

        bundles.forEach((bundle) =>
        {
            bundle.assets.forEach((asset) =>
            {
                const names = nameMap.get(asset) as string[];

                asset.name = uniqueArrays.find((arr) => arr.every((x) => names.includes(x))) as string[];
            });
        });
    }

    // save bundles to a json file
    const entries = Object.fromEntries(bundles);
    const manifest = {
        bundles: Object.keys(entries).map((key) => entries[key]),
    };

    return manifest;
}

function collect(
    tree: RootTree,
    processor: Processor,
    bundles: Map<string, PixiManifest>,
    options: PixiManifestOptions
)
{
    // an item may have been deleted, so we don't want to add it to the manifest!
    if (tree.state === 'deleted') return;

    const targetPath = getManifestName(tree.path, processor.config.entry) || 'default';

    if (!bundles.has(targetPath))
    {
        bundles.set(targetPath, {
            name: targetPath,
            assets: [],
        });
    }

    const bundle = bundles.get(targetPath) as PixiManifest;
    let found = false;

    if (tree.transformed.length > 0)
    {
        let result: PixiManifestEntry[] = [];

        options.parsers.forEach((parser) =>
        {
            if (parser.type !== SavableAssetCache.get(tree.path).transformData.type) return;
            result = parser.parser(tree as ChildTree, processor, options);

            found = true;
        });

        if (!found)
        {
            result = options.parsers.find(
                (parser) => parser.type === 'copy')?.parser(tree as ChildTree, processor, options) as PixiManifestEntry[];
        }

        const hasIgnoreFileExtensions = options.ignoreFileExtensions !== undefined
            && options.ignoreFileExtensions.length > 0;

        result.forEach((entry, index) =>
        {
            if (hasIgnoreFileExtensions)
            {
                if (Array.isArray(entry.srcs))
                {
                    for (const src of entry.srcs)
                    {
                        if (options.ignoreFileExtensions?.some((extensionName) => src.endsWith(extensionName)))
                        {
                            result.splice(index, 1);

                            return;
                        }
                    }
                }
                else
                {
                    const src = entry.srcs as string;

                    if (options.ignoreFileExtensions?.some((extensionName) => src.endsWith(extensionName)))
                    {
                        result.splice(index, 1);

                        return;
                    }
                }
            }

            if (!entry.data?.tags && (Object.keys(tree.fileTags).length > 0 || Object.keys(tree.pathTags).length > 0))
            {
                entry.data = entry.data || {} as PixiManifestEntry['data'];
                entry.data!.tags = {
                    ...tree.fileTags,
                    ...tree.pathTags,
                };
            }

            entry.name = getShortNames(entry.name, options);
        });
        bundle.assets.push(...result);
    }

    bundles.set(targetPath, bundle);

    // nothing was copied or created..
    for (const i in tree.files)
    {
        collect(tree.files[i], processor, bundles, options);
    }
}

export function defaultPixiParser(tree: ChildTree, processor: Processor, _options: PixiManifestOptions): PixiManifestEntry[]
{
    const transformData = SavableAssetCache.get(tree.path).transformData;

    const res = transformData.files.map((file) =>
    {
        const name = processor.trimOutputPath(file.name ?? file.paths[0]);

        const res: PixiManifestEntry =  {
            name,
            srcs: file.paths.map((path) => processor.trimOutputPath(path)),
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        file.data && (res.data = file.data as PixiManifestEntry['data']);

        return res;
    });

    return res;
}

function getShortNames(name: string | string[], options: PixiManifestOptions)
{
    const isNameArray = Array.isArray(name);
    const createShortcuts = options.createShortcuts;
    const trimExtensions = options.trimExtensions;

    // if a parser has returned multiple names, then we don't create the shortcut
    if (isNameArray && name.length > 1) return name;

    const allNames = [];

    name = isNameArray ? name[0] : name as string;

    allNames.push(name);
    /* eslint-disable @typescript-eslint/no-unused-expressions */
    trimExtensions && allNames.push(path.trimExt(name));
    createShortcuts && allNames.push(path.basename(name));
    createShortcuts && trimExtensions && allNames.push(path.trimExt(path.basename(name)));
    /* eslint-enable @typescript-eslint/no-unused-expressions */

    return allNames;
}
