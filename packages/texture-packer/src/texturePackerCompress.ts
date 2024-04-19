import type { Asset, AssetPipe, PluginOptions } from '@play-co/assetpack-core';
import { checkExt, createNewAssetAt, swapExt  } from '@play-co/assetpack-core';
import fs from 'fs-extra';

export type TexturePackerCompressOptions = PluginOptions<'tps'>;

export function texturePackerCompress(_options?: TexturePackerCompressOptions): AssetPipe<TexturePackerCompressOptions>
{
    const defaultOptions = {
        tags: {
            tps: 'tps',
            ..._options?.tags
        }
    };

    return {
        name: 'texture-packer-compress',
        defaultOptions,
        test(asset: Asset, options)
        {
            return (asset.allMetaData[options.tags.tps] && checkExt(asset.path, '.json'));
        },
        async transform(asset: Asset)
        {
            const originalSprite: Asset = asset.allMetaData.spriteAsset;

            const json = fs.readJSONSync(asset.path);

            if (!originalSprite.transformChildren.length)
            {
                return [asset];
            }

            const assets = originalSprite.transformChildren.map((child) =>
            {
                const extension = child.extension;

                const newFileName = swapExt(child.filename, `${extension}.json`);

                const newAsset = createNewAssetAt(asset, newFileName);

                // TODO THIS NEEDS TO BE FIXED
                // // make sure the new asset knows about the sprite asset
                // newAsset.metaData.spriteAsset = child;

                json.meta.image = swapExt(json.meta.image, extension);

                newAsset.buffer = Buffer.from(JSON.stringify(json, null, 2));

                return newAsset;
            });

            return assets;
        },
    };
}
