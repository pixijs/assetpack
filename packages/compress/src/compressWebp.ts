import type { AssetPipe, Asset, PluginOptions } from '@assetpack/core';
import { checkExt, createNewAssetAt } from '@assetpack/core';
import type { WebpOptions } from 'sharp';
import sharp from 'sharp';
import { writeFile } from 'fs-extra';

interface CompressWebpOptions extends PluginOptions<'nc'>
{
    compression?: Omit<WebpOptions, 'force'>;
}

export function compressWebp(_options: CompressWebpOptions = {}): AssetPipe
{
    const defaultOptions = {
        compression: {
            quality: 80,
            ..._options?.compression
        },
        tags: {
            nc: 'nc',
            ..._options?.tags
        }
    };

    return {
        name: 'webp',
        folder: false,
        defaultOptions,
        test: (asset: Asset, options) =>
            !asset.allMetaData[options.tags.nc] && checkExt(asset.path, '.png', '.jpg', '.jpeg'),

        transform: async (asset: Asset, options) =>
        {
            const newFileName = asset.filename.replace(/\.(png|jpg|jpeg)$/i, '.webp');

            const newAsset = createNewAssetAt(asset, newFileName);

            const buffer = await sharp(asset.path)
                .webp({ ...options.compression, force: true })
                .toBuffer();

            await writeFile(newAsset.path, buffer);

            return [newAsset];
        }
    };
}
