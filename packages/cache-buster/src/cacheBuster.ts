import type { AssetPipe, Asset } from '@play-co/assetpack-core';
import { createNewAssetAt, swapExt } from '@play-co/assetpack-core';

import { crc32 as calculateCrc32 } from '@node-rs/crc32';

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

            // by attaching the buffer - we can avoid reading the file again
            // and the final copy op will use the buffer, rather than the file path!
            newAsset.buffer = asset.buffer;

            return [newAsset];
        }
    };
}

/** Calculate a CRC32 checksum. */
export function crc32(input: string | Buffer): string
{
    const checksumHex = calculateCrc32(input).toString(16);

    return Buffer.from(checksumHex, 'hex').toString('base64url');
}
