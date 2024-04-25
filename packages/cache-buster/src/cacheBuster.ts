import type { AssetPipe, Asset } from '@play-co/assetpack-core';
import { createNewAssetAt, swapExt } from '@play-co/assetpack-core';

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
            const newFileName = swapExt(asset.filename, `-${hash}${asset.extension}`);

            const newAsset = createNewAssetAt(asset, newFileName);

            newAsset.buffer = asset.buffer;

            return [newAsset];
        },
    };
}
