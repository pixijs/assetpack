import type { AssetPipe, Asset } from '@play-co/assetpack-core';
import { checkExt, dirname, joinSafe } from '@play-co/assetpack-core';

/**
 * Use this pipe in conjunction with the texture packer pipe and the cache buster pipe.
 * As the cache buster pipe will rename the sprite asset,
 * this pipe will update the texture packer json file to point to the new sprite asset.
 * @returns - AssetPipe
 */
export function texturePackerCacheBuster(): AssetPipe
{
    const defaultOptions = {};

    return {
        folder: false,
        name: 'cache-buster-texture-packer',
        defaultOptions,
        test(asset: Asset)
        {
            return asset.allMetaData.tps && checkExt(asset.path, '.json');
        },
        async transform(asset: Asset)
        {
            if (!asset.buffer)
            {
                throw new Error('Cache buster texture packer requires a buffer');
            }

            const json = JSON.parse(asset.buffer.toString());

            const spriteAsset = asset.allMetaData.spriteAsset as Asset;

            // TODO this could be found from the transform type perhaps?
            const cacheBustedFileName = spriteAsset.transformChildren[0].filename;

            json.meta.image = joinSafe(dirname(json.meta.image), cacheBustedFileName);

            asset.buffer = Buffer.from(JSON.stringify(json, null, 2));

            return [asset];
        }
    };
}
