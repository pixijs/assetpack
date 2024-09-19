import fs from 'fs-extra';
import type { Asset, AssetPipe } from '../core/index.js';
import { checkExt, findAssets } from '../core/index.js';
import { AtlasView } from './AtlasView.js';

type SpinsAsset = {
    name: string;
    directory: string;
    atlas?: Asset;
    json?: Asset;
};

export interface SpineAtlasCacheBusterOptions {
    /**
     * Set this value to true if .atlas file and .json file must have the same file names (including the HASH in the name).
     * This is important for the Pixi spineTextureAtlasLoader function
     */
    jsonAndAltasHasTheSameNames?: boolean;
}

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
export function spineAtlasCacheBuster(
    _options: SpineAtlasCacheBusterOptions = {},
): AssetPipe<SpineAtlasCacheBusterOptions> {
    const defaultOptions = {
        jsonAndAltasHasTheSameNames: false,
        ..._options,
    };

    const potentialSpineAssetsToFix: SpinsAsset[] = [];
    const atlasExt = '.atlas';
    const jsonExt = '.json';

    return {
        folder: false,
        name: 'spine-cache-buster',
        defaultOptions,
        test(asset: Asset, _options) {
            return checkExt(asset.path, atlasExt) || checkExt(asset.path, jsonExt);
        },

        async transform(asset: Asset, _options) {
            const name = getAssetFileNameWithoutHashAndExtension(asset);
            let spineAsset: SpinsAsset | undefined = potentialSpineAssetsToFix.find(
                (item) => item.name === name && item.directory === asset.directory,
            );
            if (spineAsset === undefined) {
                spineAsset = {
                    name: name,
                    directory: asset.directory,
                };
                potentialSpineAssetsToFix.push(spineAsset);
            }

            if (asset.extension === atlasExt) {
                spineAsset.atlas = asset;
            }

            if (asset.extension === jsonExt) {
                spineAsset.json = asset;
            }

            return [asset];
        },

        async finish(asset: Asset, options) {
            const spineAssetsToFix = potentialSpineAssetsToFix.filter(
                (item) => item.atlas !== undefined && item.json !== undefined,
            );

            spineAssetsToFix.forEach((spineAsset) => {
                // we are going to replace the textures in the atlas file with the new cache busted textures
                // as we do this, the hash of the atlas file will change, so we need to update the path
                // and also remove the original file.
                // first we retrieve the final transformed children - so the atlas files that have been copied
                // to the output folder.
                const atlasAsset = spineAsset.atlas?.getFinalTransformedChildren()[0];
                const jsonAsset = spineAsset.json?.getFinalTransformedChildren()[0];
                if (atlasAsset === undefined) {
                    return;
                }
                if (jsonAsset === undefined) {
                    return;
                }

                const originalHash = atlasAsset.hash;
                const originalPath = atlasAsset.path;
                const atlasView = new AtlasView(atlasAsset.buffer);

                atlasView.getTextures().forEach((texture) => {
                    const textureAssets = findAssets((asset) => asset.filename === texture, asset, true);
                    // last transformed child is the renamed texture
                    const cacheBustedTexture = textureAssets[0].getFinalTransformedChildren()[0];
                    atlasView.replaceTexture(texture, cacheBustedTexture.filename);
                });

                atlasAsset.buffer = atlasView.buffer;

                if (options.jsonAndAltasHasTheSameNames) {
                    atlasAsset.path = atlasAsset.path.replace(originalHash, jsonAsset.hash);
                } else {
                    atlasAsset.path = atlasAsset.path.replace(originalHash, atlasAsset.hash);
                }

                (fs as any).removeSync(originalPath);

                // rewrite..
                fs.writeFileSync(atlasAsset.path, atlasAsset.buffer);
            });

            potentialSpineAssetsToFix.length = 0;
        },
    };
}

function getAssetFileNameWithoutHashAndExtension(asset: Asset): string {
    return asset.filename.split('-')[0];
}
