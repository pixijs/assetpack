import type { ChildTree, Plugin, Processor, RootTree, Tags } from '@assetpack/core';
import { Logger, path, SavableAssetCache } from '@assetpack/core';
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
        defaultParser: { type: 'copy', parser: defaultParser },
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
        parsers!.forEach((parser) =>
        {
            if (parser.type !== SavableAssetCache.get(tree.path).transformData.type) return;
            const parserResult = parser.parser(tree as ChildTree, processor);

            parserResult.forEach((entry) =>
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
            bundle.assets.push(...parserResult);
            found = true;
        });

        if (!found)
        {
            Logger.error(`[pixi-manifest] No parser found for ${tree.path}. Skipping file.`);
        }
    }

    bundles.set(targetPath, bundle);

    // nothing was copied or created..
    for (const i in tree.files)
    {
        collect(tree.files[i], processor, bundles, parsers);
    }
}

function defaultParser(tree: ChildTree, processor: Processor): PixiManifestEntry[]
{
    const transformData = SavableAssetCache.get(tree.path).transformData;
    const res = transformData.files.map((file) =>
    {
        const ext = path.extname(file.path);
        const name = processor.trimOutputPath(file.path);
        const extensions = file.transformedPaths.map((transformedPath) => path.extname(transformedPath).replace('.', ''));

        extensions.push(ext.replace('.', ''));

        const fullname = `${path.removeExt(name, ext)}.{${extensions.join(',')}}`;

        return {
            name: processor.trimOutputPath(file.path),
            srcs: [fullname],
        };
    });

    return res;
}
