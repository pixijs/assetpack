import { createNewAssetAt, stripTags, swapExt } from '@play-co/assetpack-core';

import type { Asset, AssetPipe } from '@play-co/assetpack-core';

/**
 * Cache buster asset pipe. This pipe will add a hash to the end of the filename
 * the hash is calculated from the contents of the file.
 *
 * worth noting that when combined with the texture packer plugin, an additional
 * plugin is required to update the texture packer json files to point to the new
 * file names (`texturePackerCacheBuster.ts`)
 *
 * @returns the cache buster asset pipe
 */
export function cacheBuster(): AssetPipe
{
    const defaultOptions = {};

    return {
        folder: false,
        name: 'cache-buster',
        defaultOptions,
        test(asset: Asset)
        {
            return !asset.isFolder;
        },
        async transform(asset: Asset)
        {
            const hash = asset.hash;

            // first try to stick the has on the end of the original file name
            const originalFileName = swapExt(stripTags(asset.rootTransformAsset.filename), '');

            let newFileName: string;

            if (asset.filename.includes(originalFileName))
            {
                newFileName = asset.filename.replace(originalFileName, `${originalFileName}-${hash}`);
            }
            else
            {
                // failing that just stick it on the end!
                newFileName = swapExt(asset.filename, `-${hash}${asset.extension}`);
            }

            const newAsset = createNewAssetAt(asset, newFileName);

            newAsset.buffer = asset.buffer;

            return [newAsset];
        },
    };
}
