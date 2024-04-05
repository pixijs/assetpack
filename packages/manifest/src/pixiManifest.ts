import {
    stripTags,
    type Asset,
    type AssetPipe,
    type PipeSystem,
    basename,
    joinSafe,
    relative,
    trimExt,
    dirname
} from '@play-co/assetpack-core';

import { writeJSON } from 'fs-extra';
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
        // tags: Tags;
        [x: string]: any;
    };
}

export interface PixiManifestOptions// extends BaseManifestOptions
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
            const newFileName = dirname(options.output) === '.'
                ? joinSafe(pipeSystem.outputPath, options.output) : options.output;

            const manifest = {
                bundles: [
                    {
                        name: 'default',
                        assets: []
                    }
                ]
            };

            collectAssets(asset, options, pipeSystem.outputPath, pipeSystem.entryPath, manifest.bundles, 0);

            await writeJSON(newFileName, manifest, { spaces: 2 });
        }
    };
}

function collectAssets(
    asset: Asset,
    options: PixiManifestOptions,
    outputPath = '',
    entryPath = '',
    bundles: PixiManifest[],
    bundleIndex = 0
)
{
    if (asset.metaData.m || asset.metaData.manifest)
    {
        bundles.push({
            name: stripTags(asset.filename),
            assets: []
        });

        bundleIndex++;
    }

    const bundleAssets = bundles[bundleIndex].assets;

    const finalAssets = asset.getFinalTransformedChildren();

    if (asset.transformChildren.length > 0)
    {
        if (asset.metaData.tps)
        {
            // console.log('SPRITE SHEEET PACKED');
            // do some special think for textures packed sprite sheet pages..
            getTexturePackedAssets(finalAssets).forEach((pages, pageIndex) =>
            {
                //     console.log('PAGES', pages, pageIndex);
                bundleAssets.push({
                    name: getShortNames(stripTags(relative(entryPath, `${asset.path}-${pageIndex}`)), options),
                    srcs: pages.map((finalAsset) => relative(outputPath, finalAsset.path))
                });
            });
        }
        else
        {
            bundleAssets.push({
                name: getShortNames(stripTags(relative(entryPath, asset.path)), options),
                srcs: finalAssets.map((finalAsset) => relative(outputPath, finalAsset.path))
            });
        }
    }

    if (!asset.ignoreChildren)
    {
        asset.children.forEach((child) =>
        {
            collectAssets(child, options, outputPath, entryPath, bundles, bundleIndex);
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
    trimExtensions && allNames.push(trimExt(name));
    createShortcuts && allNames.push(basename(name));
    createShortcuts && trimExtensions && allNames.push(trimExt(basename(name)));
    /* eslint-enable @typescript-eslint/no-unused-expressions */

    return allNames;
}
