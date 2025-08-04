import fs from 'fs-extra';
import { checkExt, findAssets } from '../core/index.js';
import { AtlasView } from './AtlasView.js';

import type { Asset, AssetPipe } from '../core/index.js';

/**
 * This should be used after the cache buster plugin in the pipes.
 * As it relies on the cache buster plugin to have already cache busted all files.
 * This corrects the atlas files to point to the new cache busted textures.
 * At the same time it updates the hash of the files.
 *
 * As this pipe needs to know about all the textures in the atlas files most of the work is done
 * in the finish method.
 *
 * Kind of like applying a patch at the end of the transform process.
 *
 * @param _options
 * @returns
 */
export function spineAtlasCacheBuster(): AssetPipe {
    const defaultOptions = {};

    const atlasFileToFix: Asset[] = [];

    return {
        folder: false,
        name: 'spine-cache-buster',
        defaultOptions,
        test(asset: Asset, _options) {
            return checkExt(asset.path, '.atlas');
        },

        async transform(asset: Asset, _options) {
            atlasFileToFix.push(asset);

            return [asset];
        },

        async finish(asset: Asset) {
            // first we retrieve the final transformed children - so the atlas files that have been copied
            // to the output folder.
            const atlasAssets = atlasFileToFix.map((asset) => asset.getFinalTransformedChildren()[0]);

            atlasAssets.forEach((atlasAsset) => {
                // we are going to replace the textures in the atlas file with the new cache busted textures
                // as we do this, the hash of the atlas file will change, so we need to update the path
                // and also remove the original file.

                const originalHash = atlasAsset.hash!;
                const originalPath = atlasAsset.path;

                const atlasView = new AtlasView(atlasAsset.buffer);

                atlasView.getTextures().forEach((texture) => {
                    const textureAssets = findAssets((asset) => asset.filename === texture && asset.rootTransformAsset.directory === atlasAsset.rootTransformAsset.directory, asset, true);

                    // last transformed child is the renamed texture
                    const cacheBustedTexture = textureAssets[0].getFinalTransformedChildren()[0];

                    atlasView.replaceTexture(texture, cacheBustedTexture.filename);
                });

                atlasAsset.buffer = atlasView.buffer;

                atlasAsset.path = atlasAsset.path.replace(originalHash, atlasAsset.hash!);

                fs.removeSync(originalPath);

                // rewrite..
                fs.writeFileSync(atlasAsset.path, atlasAsset.buffer);
            });

            atlasFileToFix.length = 0;
        },
    };
}
