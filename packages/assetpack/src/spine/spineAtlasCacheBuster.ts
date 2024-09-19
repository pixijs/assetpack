import fs from 'fs-extra';
import { checkExt, findAssets } from '../core/index.js';
import { AtlasView } from './AtlasView.js';

import type { Asset, AssetPipe } from '../core/index.js';
import { persistMessage } from '../core/logger/render.js';

type SpinsAsset = {
    name: string;
    directory: string;
    atlas?: Asset;
    json?: Asset;
};

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
    const potentialSpineAssetsToFix: SpinsAsset[] = [];
    const atlasExt = '.atlas';
    const jsonExt = '.json';

    return {
        folder: false,
        name: 'spine-cache-buster',
        defaultOptions,
        test(asset: Asset, _options) {
            persistMessage(`TEST: (${asset.path}): isSuitable=${checkExt(asset.path, '.atlas')}`);

            return checkExt(asset.path, atlasExt) || checkExt(asset.path, jsonExt);
        },

        async transform(asset: Asset, _options) {
            persistMessage(
                `TRANSFORM: (${asset.filename}) (${getAssetFileNameWithoutHashAndExtension(asset)}) ${asset.directory}`,
            );
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

            if (asset.extension === '.atlas') {
                atlasFileToFix.push(asset);
            }
            return [asset];
        },

        async finish(asset: Asset) {
            persistMessage(`FINISH: (${asset.path})`);

            persistMessage('PRINTING POTENTIAL SPINE');
            persistMessage('-----------------------');
            const spineAssetsToFix = potentialSpineAssetsToFix.filter(
                (item) => item.atlas !== undefined && item.json !== undefined,
            );
            spineAssetsToFix.forEach((item) =>
                persistMessage(`${item.name}: ${item.atlas?.filename} ${item.json?.filename}`),
            );
            persistMessage('++++++++++++++++++++++++');

            // first we retrieve the final transformed children - so the atlas files that have been copied
            // to the output folder.
            const atlasAssets = atlasFileToFix.map((asset) => asset.getFinalTransformedChildren()[0]);

            atlasAssets.forEach((atlasAsset) => {
                // we are going to replace the textures in the atlas file with the new cache busted textures
                // as we do this, the hash of the atlas file will change, so we need to update the path
                // and also remove the original file.

                const originalHash = atlasAsset.hash;
                const originalPath = atlasAsset.path;

                persistMessage(`${atlasAsset.filename}: HASH=${originalHash} PATH=${originalPath}`);

                const atlasView = new AtlasView(atlasAsset.buffer);

                atlasView.getTextures().forEach((texture) => {
                    const textureAssets = findAssets((asset) => asset.filename === texture, asset, true);
                    // const jsons = findAssets((asset) => asset.extension === '.json', asset, true);

                    // persistMessage(`Textures ${textureAssets.length}`);
                    // textureAssets.forEach((t) =>
                    //     persistMessage(`${t.filename}: HASH=${t.hash} PATH=${t.path} EXT=${t.extension}`),
                    // );

                    // persistMessage(`jsons ${jsons.length}`);
                    // jsons.forEach((t) =>
                    //     persistMessage(`${t.filename}: HASH=${t.hash} PATH=${t.path} EXT=${t.extension}`),
                    // );

                    // persistMessage(
                    //     `FIRST TEXTURE: HASH=${textureAssets[0].hash} PATH=${textureAssets[0].path} EXT=${textureAssets[0].extension}`,
                    // );

                    // last transformed child is the renamed texture
                    const cacheBustedTexture = textureAssets[0].getFinalTransformedChildren()[0];
                    // persistMessage(
                    //     `cacheBustedTexture: HASH=${cacheBustedTexture.hash} PATH=${cacheBustedTexture.path} EXT=${cacheBustedTexture.extension}`,
                    // );
                    atlasView.replaceTexture(texture, cacheBustedTexture.filename);
                });

                atlasAsset.buffer = atlasView.buffer;
                atlasAsset.path = atlasAsset.path.replace(originalHash, atlasAsset.hash);

                (fs as any).removeSync(originalPath);

                // rewrite..
                fs.writeFileSync(atlasAsset.path, atlasAsset.buffer);
            });

            atlasFileToFix.length = 0;
        },
    };
}

function getAssetFileNameWithoutHashAndExtension(asset: Asset): string {
    return asset.filename.split('-')[0];
}
