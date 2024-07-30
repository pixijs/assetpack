import sharp from 'sharp';
import { checkExt, createNewAssetAt } from '../core/index.js';
import { compressSharp } from './utils/compressSharp.js';
import { resolveOptions } from './utils/resolveOptions.js';
import { BYPASS } from './constants.js';

import type { AvifOptions, JpegOptions, PngOptions, WebpOptions } from 'sharp';
import type { Asset, AssetPipe, PluginOptions } from '../core/index.js';

type CompressJpgOptions = Omit<JpegOptions, 'force'>;
type CompressWebpOptions = Omit<WebpOptions, 'force'>;
type CompressAvifOptions = Omit<AvifOptions, 'force'>;
type CompressPngOptions = Omit<PngOptions, 'force'>;

export interface CompressOptions extends PluginOptions
{
    png?: CompressPngOptions | boolean | typeof BYPASS;
    webp?: CompressWebpOptions | boolean | typeof BYPASS;
    avif?: CompressAvifOptions | boolean | typeof BYPASS;
    jpg?: CompressJpgOptions | boolean | typeof BYPASS;
}

export interface CompressImageData
{
    format: '.avif' | '.png' | '.webp' | '.jpg' | '.jpeg';
    resolution: number;
    sharpImage: sharp.Sharp;
}

export function compress(options: CompressOptions = {}): AssetPipe<CompressOptions, 'nc'>
{
    const compress = resolveOptions<CompressOptions>(options, {
        png: true,
        jpg: true,
        webp: true,
        avif: false,
    });

    if (compress)
    {
        compress.jpg = resolveOptions<CompressJpgOptions>(compress.jpg, {

        });
        compress.png = resolveOptions<CompressPngOptions>(compress.png, {
            quality: 90,
        });
        compress.webp = resolveOptions<CompressWebpOptions>(compress.webp, {
            quality: 80,
            alphaQuality: 80,
        });
        compress.avif = resolveOptions<CompressAvifOptions>(compress.avif, {

        });
    }

    return {
        folder: true,
        name: 'compress',
        defaultOptions: {
            ...compress,
        },
        tags: {
            nc: 'nc',
        },
        test(asset: Asset, options)
        {
            return options && checkExt(asset.path, '.png', '.jpg', '.jpeg') && !asset.allMetaData[this.tags!.nc];
        },
        async transform(asset: Asset, options)
        {
            const shouldCompress = compress && !asset.metaData.nc;

            if (!shouldCompress)
            {
                return [];
            }

            try
            {
                const image: CompressImageData = {
                    format: asset.extension as CompressImageData['format'],
                    resolution: 1,
                    sharpImage: sharp(asset.buffer),
                };

                const processedImages = await compressSharp(image, options);

                const newAssets = processedImages.map((data) =>
                {
                    const end = `${data.format}`;
                    const filename = asset.filename
                        .replace(/\.[^/.]+$/, end);

                    const newAsset = createNewAssetAt(
                        asset,
                        filename
                    );

                    return newAsset;
                });

                // bypass source asset
                if (options[asset.extension.slice(1) as keyof CompressOptions] === BYPASS) {
                    newAssets.push(asset);
                }

                const promises = processedImages.map((image, i) => image.sharpImage.toBuffer().then((buffer) =>
                {
                    newAssets[i].buffer = buffer;
                }));

                await Promise.all(promises);

                return newAssets;
            }
            catch (error)
            {
                throw new Error(`[AssetPack][compress] Failed to compress image: ${asset.path} - ${error}`);
            }
        },

    };
}

