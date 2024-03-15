import type { AssetPipe, Asset, PluginOptions } from '@assetpack/core';
import { checkExt, createNewAssetAt } from '@assetpack/core';
import type { JpegOptions } from 'sharp';
import sharp from 'sharp';
import { writeFile } from 'fs-extra';

interface CompressJpgOptions extends PluginOptions<'nc'>
{
    compression?: Omit<JpegOptions, 'force'>;
}

export function compressJpg(_options: CompressJpgOptions = {}): AssetPipe
{
    const defaultOptions = {
        compression: {
            ..._options?.compression
        },

        tags: {
            nc: 'nc',
            ..._options?.tags
        }
    };

    return {
        name: 'jpg',
        folder: false,
        defaultOptions,
        test: (asset: Asset, options) =>
            !asset.allMetaData[options.tags.nc] && checkExt(asset.path, '.jpg', '.jpeg'),

        transform: async (asset: Asset, options) =>
        {
            const newFileName = asset.filename.replace(/\.(jpg|jpeg)$/i, '.jpg');

            const newAsset = createNewAssetAt(asset, newFileName);

            const buffer = await sharp(asset.path)
                .jpeg({ ...options.compression, force: true })
                .toBuffer();

            await writeFile(newAsset.path, buffer);

            return [newAsset];
        }
    };
}
