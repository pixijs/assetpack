import type { AssetPipe, Asset, PluginOptions } from '@assetpack/core';
import { checkExt, createNewAssetAt } from '@assetpack/core';
import type { PngOptions } from 'sharp';
import sharp from 'sharp';
import { writeFile } from 'fs-extra';

interface CompressPngOptions extends PluginOptions<'nc'>
{
    compression?: Omit<PngOptions, 'force'>;
}

export function compressPng(_options: CompressPngOptions = {}): AssetPipe
{
    const defaultOptions: CompressPngOptions = {
        compression: {
            quality: 90,
            ..._options?.compression
        },
        tags: {
            nc: 'nc',
            ..._options?.tags
        }
    };

    return {
        name: 'png',
        folder: false,
        defaultOptions,
        test: (asset: Asset, options) =>
            !asset.allMetaData[options.tags.nc] && checkExt(asset.path, '.png'),

        transform: async (asset: Asset, options) =>
        {
            const newAsset = createNewAssetAt(asset, asset.filename);

            const buffer = await sharp(asset.path)
                .png({ ...options.compression, force: true })
                .toBuffer();

            await writeFile(newAsset.path, buffer);

            return [newAsset];
        }
    };
}
