import type { Asset } from '@play-co/assetpack-core';
import { checkExt, type AssetPipe, findAssetsWithFileName } from '@play-co/assetpack-core';
import { removeSync, writeFileSync } from 'fs-extra';

/**
 * This should be used after the cache buster plugin in the pipes.
 * As it relies on the cache buster plugin to have already cache busted all files.
 * This corrects the sprite sheet files to point to the new cache busted textures.
 * At the same time it updates the hash of the files.
 *
 * As this pipe needs to know about all the textures in the texture files most of the work is done
 * in the finish method.
 *
 * Kind of like applying a patch at the end of the transform process.
 *
 * @param _options
 * @returns
 */
export function texturePackerCacheBuster(): AssetPipe
{
    const defaultOptions = {};

    const textureJsonFilesToFix: Asset[] = [];

    return {
        folder: false,
        name: 'texture-packer-cache-buster',
        defaultOptions,
        test(asset: Asset, _options)
        {
            return asset.allMetaData.tps && checkExt(asset.path, '.json');
        },

        async transform(asset: Asset, _options)
        {
            textureJsonFilesToFix.push(asset);

            return [asset];
        },

        async finish(asset: Asset)
        {
            // first we retrieve the final transformed children - so the atlas files that have been copied
            // to the output folder.
            const jsonAssets = textureJsonFilesToFix.map((asset) => asset.getFinalTransformedChildren()[0]);

            jsonAssets.forEach((jsonAsset) =>
            {
                // we are going to replace the textures in the atlas file with the new cache busted textures
                // as we do this, the hash of the atlas file will change, so we need to update the path
                // and also remove the original file.

                const originalHash = jsonAsset.hash;
                const originalPath = jsonAsset.path;

                const json = JSON.parse(jsonAsset.buffer.toString());

                const texture = json.meta.image;

                const textureAssets = findAssetsWithFileName((asset) =>
                    asset.filename === texture, asset, true);

                // last transformed child is the renamed texture
                const cacheBustedTexture =  textureAssets[0].getFinalTransformedChildren()[0];

                json.meta.image = cacheBustedTexture.filename;

                jsonAsset.buffer = Buffer.from(JSON.stringify(json));

                jsonAsset.path = jsonAsset.path.replace(originalHash, jsonAsset.hash);

                removeSync(originalPath);

                // rewrite..
                writeFileSync(jsonAsset.path, jsonAsset.buffer);
            });

            textureJsonFilesToFix.length = 0;
        }
    };
}
