import fs from 'fs-extra';
import { json2xml, xml2json } from 'xml-js';
import { checkExt, createNewAssetAt, findAssets, stripTags } from '../core/index.js';

import type { Asset, AssetPipe } from '../core/index.js';
import type { jsonType, pageType } from './sdf.js';

/**
 * This should be used after the cache buster plugin in the pipes.
 * As it relies on the cache buster plugin to have already cache busted all files.
 * This corrects the bmfont files to point to the new cache busted textures.
 * At the same time it updates the hash of the files.
 *
 * As this pipe needs to know about all the textures in the texture files most of the work is done
 * in the finish method.
 *
 * Kind of like applying a patch at the end of the transform process.
 *
 * @returns
 */
export function SDFCacheBuster(): AssetPipe<any, 'sdf' | 'msdf'>
{
    const fontFilesToFix: Asset[] = [];

    return {
        folder: false,
        name: 'sdf-cache-buster',
        defaultOptions: null,
        tags: {
            sdf: 'sdf',
            msdf: 'msdf',
        },
        test(asset: Asset)
        {
            return (asset.allMetaData[this.tags!.sdf] || asset.allMetaData[this.tags!.msdf]) && checkExt(asset.path, '.fnt', '.xml');
        },

        async transform(asset: Asset)
        {
            const newFontAsset = createNewAssetAt(asset, asset.filename);

            newFontAsset.buffer = asset.buffer;

            fontFilesToFix.push(newFontAsset);

            return [newFontAsset];
        },

        async finish(asset: Asset)
        {
            // first we retrieve the final transformed children - so the atlas files that have been copied
            // to the output folder.
            const fntAssets = fontFilesToFix.map((asset) => asset.getFinalTransformedChildren()[0]);

            // loop through all the fnt files back to front
            for (let i = fntAssets.length - 1; i >= 0; i--)
            {
                // we are going to replace the textures in the fnt file with the new cache busted textures
                // as we do this, the hash of the fnt file will change, so we need to update the path
                // and also remove the original file.
                const fntAsset = fntAssets[i];
                const originalHash = fntAsset.hash;
                const originalPath = fntAsset.path;
                const str = fntAsset.buffer.toString()
                    .replaceAll('&', '&amp;');

                const fntJsonStr = xml2json(str, { compact: true });

                const json: jsonType = JSON.parse(fntJsonStr);

                const textures = json.font.pages.page;

                if (Array.isArray(textures))
                {
                    textures.map((txtr) =>
                        resetFileName(txtr, fntAsset, asset));
                }
                else
                {
                    resetFileName(textures, fntAsset, asset);
                }

                fntAsset.buffer = Buffer.from(json2xml(JSON.stringify(json), {
                    compact: true,
                    spaces: 4,
                }));
                fntAsset.path = fntAsset.path.replace(originalHash, fntAsset.hash);
                fs.removeSync(originalPath);

                // rewrite..
                fs.writeFileSync(fntAsset.path, fntAsset.buffer);
            }

            fontFilesToFix.length = 0;
        },
    };
}

function resetFileName(pack: pageType, fntAsset: Asset, asset: Asset)
{
    const filename = pack._attributes.file;
    const foundAssets = findAssets((assetObj) => stripTags(assetObj.filename) === filename // check filename
        && fntAsset.rootTransformAsset.directory === assetObj.rootTransformAsset.directory, asset, true);

    pack._attributes.file = foundAssets[0].getFinalTransformedChildren()[0].filename;

    return pack._attributes.file;
}
