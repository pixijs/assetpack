import fs from 'fs-extra';
import { path, stripTags } from '../core/index.js';

import type {
    Asset,
    AssetPipe,
    PipeSystem, PluginOptions
} from '../core/index.js';

export interface PixiBundle
{
    name: string;
    assets: PixiManifestEntry[];
}

export interface PixiManifest
{
    bundles: PixiBundle[];
}

export interface PixiManifestEntry
{
    alias: string | string[];
    src: string | string[];
    data?: {
        // tags: Tags;
        [x: string]: any;
    };
}

export interface PixiManifestOptions extends PluginOptions
{
    /**
     * The output location for the manifest file.
     */
    output?: string;
    /**
     * if true, the alias will be created with the basename of the file.
     */
    createShortcuts?: boolean;
    /**
     * if true, the extensions will be removed from the alias names.
     */
    trimExtensions?: boolean;
    /**
     * if true, the metaData will be outputted in the data field of the manifest.
     */
    includeMetaData?: boolean;
    /**
     * if true, the all tags will be outputted in the data.tags field of the manifest.
     * If false, only internal tags will be outputted to the data.tags field. All other tags will be outputted to the data field directly.
     * @example
     * ```json
     * {
     *   "bundles": [
     *     {
     *       "name": "default",
     *       "assets": [
     *         {
     *           "alias": ["test"],
     *           "src": ["test.png"],
     *           "data": {
     *             "tags": {
     *               "nc": true,
     *               "customTag": true // this tag will be outputted to the data field directly instead of the data.tags field
     *             }
     *           }
     *         }
     *       ]
     *     }
     *   ]
     * }
     * @default true
     */
    legacyMetaDataOutput?: boolean;
}

export function pixiManifest(_options: PixiManifestOptions = {}): AssetPipe<PixiManifestOptions, 'manifest' | 'mIgnore'>
{
    return {
        name: 'pixi-manifest',
        defaultOptions: {
            output: 'manifest.json',
            createShortcuts: false,
            trimExtensions: false,
            includeMetaData: true,
            legacyMetaDataOutput: true,
            ..._options,
        },
        tags: {
            manifest: 'm',
            mIgnore: 'mIgnore'
        },
        async finish(asset: Asset, options, pipeSystem: PipeSystem)
        {
            const newFileName = path.dirname(options.output) === '.'
                ? path.joinSafe(pipeSystem.outputPath, options.output) : options.output;

            const defaultBundle: PixiBundle = {
                name: 'default',
                assets: []
            };

            const manifest: PixiManifest = {
                bundles: [defaultBundle]
            };

            collectAssets(
                asset,
                options,
                pipeSystem.outputPath,
                pipeSystem.entryPath,
                manifest.bundles,
                defaultBundle,
                this.tags!,
                pipeSystem.internalMetaData
            );
            filterUniqueNames(manifest);
            await fs.writeJSON(newFileName, manifest, { spaces: 2 });
        }
    };
}

function filterUniqueNames(manifest: PixiManifest)
{
    const nameMap = new Map<PixiManifestEntry, string[]>();

    manifest.bundles.forEach((bundle) =>
        bundle.assets.forEach((asset) => nameMap.set(asset, asset.alias as string[])));

    const arrays = Array.from(nameMap.values());
    const sets = arrays.map((arr) => new Set(arr));
    const uniqueArrays = arrays.map((arr, i) => arr.filter((x) => sets.every((set, j) => j === i || !set.has(x))));

    manifest.bundles.forEach((bundle) =>
    {
        bundle.assets.forEach((asset) =>
        {
            const names = nameMap.get(asset) as string[];

            asset.alias = uniqueArrays.find((arr) => arr.every((x) => names.includes(x))) as string[];
        });
    });
}

function collectAssets(
    asset: Asset,
    options: PixiManifestOptions,
    outputPath = '',
    entryPath = '',
    bundles: PixiBundle[],
    bundle: PixiBundle,
    tags: AssetPipe<null, 'manifest' | 'mIgnore'>['tags'],
    internalTags: Record<string, any>
)
{
    if (asset.skip) return;
    // an item may have been deleted, so we don't want to add it to the manifest!
    if (asset.state === 'deleted') return;

    let localBundle = bundle;

    if (asset.metaData[tags!.manifest!])
    {
        localBundle = {
            name: stripTags(asset.filename),
            assets: []
        };

        bundles.push(localBundle);
    }

    const bundleAssets = localBundle.assets;
    const finalAssets = asset.getFinalTransformedChildren();

    if (asset.transformChildren.length > 0)
    {
        const finalManifestAssets = finalAssets.filter((finalAsset) => !finalAsset.inheritedMetaData[tags!.mIgnore!]);

        if (finalManifestAssets.length === 0) return;

        const metadata = {
            tags: { ...asset.getInternalMetaData(internalTags) },
            ...asset.getPublicMetaData(internalTags)
        } as Record<string, any>;

        if (options.legacyMetaDataOutput)
        {
            metadata.tags = asset.allMetaData;
        }

        bundleAssets.push({
            alias: getShortNames(stripTags(path.relative(entryPath, asset.path)), options),
            src: finalManifestAssets
                .map((finalAsset) => path.relative(outputPath, finalAsset.path))
                .sort((a, b) => b.localeCompare(a)),
            data:  options.includeMetaData ? metadata : undefined
        });
    }

    asset.children.forEach((child) =>
    {
        collectAssets(child, options, outputPath, entryPath, bundles, localBundle, tags, internalTags);
    });

    // for all assets.. check for atlas and remove them from the bundle..
}

function getShortNames(name: string, options: PixiManifestOptions)
{
    const createShortcuts = options.createShortcuts;
    const trimExtensions = options.trimExtensions;

    const allNames = [];

    allNames.push(name);
    /* eslint-disable @typescript-eslint/no-unused-expressions */
    trimExtensions && allNames.push(path.trimExt(name));
    createShortcuts && allNames.push(path.basename(name));
    createShortcuts && trimExtensions && allNames.push(path.trimExt(path.basename(name)));
    /* eslint-enable @typescript-eslint/no-unused-expressions */

    // remove duplicates
    const uniqueNames = new Set(allNames);

    allNames.length = 0;
    uniqueNames.forEach((name) => allNames.push(name));

    return allNames;
}
