import type { ChildTree, Plugin, Processor, RootTree, Tags, TransformDataFile } from '@assetpack/core';
import { path, SavableAssetCache } from '@assetpack/core';
import type { BaseManifestOptions } from './manifest';
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
    defaultParser: { type: 'copy', parser: (tree: ChildTree, processor: Processor) => any[] }
    parsers?: { type: string, parser: (tree: ChildTree, processor: Processor) => PixiManifestEntry[] }[]
}

export function pixiManifest(options?: Partial<PixiManifestOptions>): Plugin<PixiManifestOptions>
{
    const defaultOptions: PixiManifestOptions = {
        defaultParser: { type: 'copy', parser: defaultPixiParser },
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

    collect(tree, processor, bundles, options.parsers || []);

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
    parsers: PixiManifestOptions['parsers']
)
{
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

        parsers!.forEach((parser) =>
        {
            if (parser.type !== SavableAssetCache.get(tree.path).transformData.type) return;
            result = parser.parser(tree as ChildTree, processor);

            found = true;
        });

        if (!found)
        {
            result = parsers?.find(
                (parser) => parser.type === 'copy')?.parser(tree as ChildTree, processor
            ) as PixiManifestEntry[];
        }

        result.forEach((entry) =>
        {
            if (!entry.data?.tags && (Object.keys(tree.fileTags).length > 0 || Object.keys(tree.pathTags).length > 0))
            {
                entry.data = entry.data || {} as PixiManifestEntry['data'];
                entry.data!.tags = {
                    ...tree.fileTags,
                    ...tree.pathTags,
                };
            }
        });
        bundle.assets.push(...result);
    }

    bundles.set(targetPath, bundle);

    // nothing was copied or created..
    for (const i in tree.files)
    {
        collect(tree.files[i], processor, bundles, parsers);
    }
}

export function parseExtensions(name: string, file: TransformDataFile, ext: string)
{
    const extensions = file.transformedPaths.map((transformedPath) =>
        path.extname(transformedPath).replace('.', ''));

    extensions.push(ext.replace('.', ''));

    return `${path.removeExt(name, ext)}.{${extensions.join(',')}}`;
}

export function defaultPixiParser(tree: ChildTree, processor: Processor): PixiManifestEntry[]
{
    const transformData = SavableAssetCache.get(tree.path).transformData;

    const res = transformData.files.map((file) =>
    {
        const ext = path.extname(file.path);
        let name = processor.trimOutputPath(file.path);

        if (transformData.resolutions && transformData.prefix)
        {
            const prefix = transformData.prefix;
            const resolutions = `{${transformData.resolutions.map((res: number) => res.toString()).join(',')}}`;

            name = name.replace(ext, `${prefix.replace('%%', resolutions)}${ext}`);
        }

        const fullname = parseExtensions(name, file, ext);

        return {
            name: processor.trimOutputPath(file.path),
            srcs: [fullname],
        };
    });

    return res;
}
