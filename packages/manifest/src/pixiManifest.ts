import {
    stripTags,
    type Asset,
    type AssetPipe,
    type PipeSystem,
    path
} from '@play-co/assetpack-core';

import fs from 'fs-extra';

export interface PixiManifest
{
    name: string;
    assets: PixiManifestEntry[];
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

export interface PixiManifestOptions
{
    output?: string;
    createShortcuts?: boolean;
    trimExtensions?: boolean;
}

export function pixiManifest(_options: PixiManifestOptions = {}): AssetPipe<PixiManifestOptions>
{
    const defaultOptions = {
        output: 'manifest.json',
        createShortcuts: false,
        trimExtensions: false,
        ..._options
    };

    return {
        name: 'pixi-manifest',
        defaultOptions,
        finish: async (asset: Asset, options, pipeSystem: PipeSystem) =>
        {
            const newFileName = path.dirname(options.output) === '.'
                ? path.joinSafe(pipeSystem.outputPath, options.output) : options.output;

            const defaultBundle =  {
                name: 'default',
                assets: []
            };

            const manifest = {
                bundles: [defaultBundle]
            };

            collectAssets(asset, options, pipeSystem.outputPath, pipeSystem.entryPath, manifest.bundles, defaultBundle);

            await fs.writeJSON(newFileName, manifest, { spaces: 2 });
        }
    };
}

function collectAssets(
    asset: Asset,
    options: PixiManifestOptions,
    outputPath = '',
    entryPath = '',
    bundles: PixiManifest[],
    bundle: PixiManifest,
)
{
    let localBundle = bundle;

    if (asset.metaData.m || asset.metaData.manifest)
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
        if (asset.metaData.tps)
        {
            // do some special think for textures packed sprite sheet pages..
            getTexturePackedAssets(finalAssets).forEach((pages, pageIndex) =>
            {
                bundleAssets.push({
                    alias: getShortNames(stripTags(path.relative(entryPath, `${asset.path}-${pageIndex}`)), options),
                    src: pages.map((finalAsset) => path.relative(outputPath, finalAsset.path))
                });
            });
        }
        else
        {
            bundleAssets.push({
                alias: getShortNames(stripTags(path.relative(entryPath, asset.path)), options),
                src: finalAssets.map((finalAsset) => path.relative(outputPath, finalAsset.path))
            });
        }
    }

    if (!asset.ignoreChildren)
    {
        asset.children.forEach((child) =>
        {
            collectAssets(child, options, outputPath, entryPath, bundles, localBundle);
        });
    }
}

function getTexturePackedAssets(assets: Asset[])
{
    // first get the jsons..
    const jsonAssets = assets.filter((asset) => asset.extension === '.json');

    const groupAssets: Asset[][] = [];

    for (let i = 0; i < jsonAssets.length; i++)
    {
        const jsonAsset = jsonAssets[i];

        groupAssets[jsonAsset.allMetaData.page] ??= [];

        groupAssets[jsonAsset.allMetaData.page].push(jsonAsset);
    }

    return groupAssets;
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

    return allNames;
}
