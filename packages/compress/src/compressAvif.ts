import type { AssetPipe, Asset, PluginOptions } from '@assetpack/core';
import { checkExt, createNewAssetAt } from '@assetpack/core';
import type { AvifOptions } from 'sharp';
import sharp from 'sharp';
import { writeFile } from 'fs-extra';

interface CompressAvifOptions extends PluginOptions<'nc'>
{
    compression?: Omit<AvifOptions, 'force'>;
}

export function compressAvif(_options: CompressAvifOptions = {}): AssetPipe
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
        name: 'avif',
        folder: false,
        defaultOptions,
        test: (asset: Asset, options) =>
            !asset.allMetaData[options.tags.nc] && checkExt(asset.path, '.png', '.jpg', '.jpeg'),

        transform: async (asset: Asset, options) =>
        {
            const newFileName = asset.filename.replace(/\.(png|jpg|jpeg)$/i, '.avif');

            const newAsset = createNewAssetAt(asset, newFileName);

            const buffer = await sharp(asset.path)
                .avif({ ...options.compression, force: true })
                .toBuffer();

            await writeFile(newAsset.path, buffer);

            return [newAsset];
        }
    };
}
