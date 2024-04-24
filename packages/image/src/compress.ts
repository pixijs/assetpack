import type { PluginOptions, Asset, AssetPipe } from '@play-co/assetpack-core';
import { checkExt, createNewAssetAt  } from '@play-co/assetpack-core';
import type { AvifOptions, JpegOptions, PngOptions, WebpOptions } from 'sharp';
import sharp from 'sharp';
import { resolveOptions } from './utils/resolveOptions';
import { compressSharp } from './utils/compressSharp';

type CompressJpgOptions = Omit<JpegOptions, 'force'>;
type CompressWebpOptions = Omit<WebpOptions, 'force'>;
type CompressAvifOptions = Omit<AvifOptions, 'force'>;
type CompressPngOptions = Omit<PngOptions, 'force'>;

export interface CompressOptions extends PluginOptions<'nc'>
{
    png?: CompressPngOptions | boolean;
    webp?: CompressWebpOptions | boolean;
    avif?: CompressAvifOptions | boolean;
    jpg?: CompressJpgOptions | boolean;
}

export interface CompressImageData
{
    format: '.avif' | '.png' | '.webp' | '.jpg' | '.jpeg';
    resolution: number;
    sharpImage: sharp.Sharp;
}

export function compress(options: CompressOptions = {}): AssetPipe<CompressOptions>
{
    const compress = resolveOptions<CompressOptions>(options, {
        png: true,
        jpg: true,
        webp: false,
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
        });
        compress.avif = resolveOptions<CompressAvifOptions>(compress.avif, {

        });
    }

    const defaultOptions = {
        ...compress,
        tags: {
            nc: 'nc',
            ...options.tags,
        }
    };

    return {
        folder: true,
        name: 'compress',
        defaultOptions,
        test(asset: Asset, options)
        {
            return options && checkExt(asset.path, '.png', '.jpg', '.jpeg') && !asset.allMetaData[options.tags.nc as any];
        },
        async transform(asset: Asset, options)
        {
            const shouldCompress = compress && !asset.metaData[options.tags.nc as any];

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

                const promises = processedImages.map((image, i) => image.sharpImage.toBuffer().then((buffer) =>
                {
                    newAssets[i].buffer = buffer;
                }));

                await Promise.all(promises);

                return newAssets;
            }
            catch (error)
            {
                throw new Error(`[AssetPack] Failed to compress image: ${asset.path} - ${error}`);
            }
        },

    };
}

