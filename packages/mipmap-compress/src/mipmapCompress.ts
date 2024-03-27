import type { PluginOptions, Asset, AssetPipe } from '@assetpack/core';
import { checkExt, createNewAssetAt  } from '@assetpack/core';
import type { AvifOptions, JpegOptions, PngOptions, WebpOptions } from 'sharp';
import sharp from 'sharp';
import { resolveOptions } from './utils/resolveOptions';
import { mipmapSharp } from './utils/mipmapSharp';
import { compressSharp } from './utils/compressSharp';

export interface MipmapOptions
{
    /** A template for denoting the resolution of the images. */
    template?: string;
    /** An object containing the resolutions that the images will be resized to. */
    resolutions?: {[x: string]: number};
    /** A resolution used if the fixed tag is applied. Resolution must match one found in resolutions. */
    fixedResolution?: string;
}

type CompressJpgOptions = Omit<JpegOptions, 'force'>;
type CompressWebpOptions = Omit<WebpOptions, 'force'>;
type CompressAvifOptions = Omit<AvifOptions, 'force'>;
type CompressPngOptions = Omit<PngOptions, 'force'>;

export interface CompressOptions
{
    png?: CompressPngOptions | boolean;
    webp?: CompressWebpOptions | boolean;
    avif?: CompressAvifOptions | boolean;
    jpg?: CompressJpgOptions | boolean;
}

export interface MipmapCompressOptions extends PluginOptions<'fix' | 'nc'>
{
    mipmap?: MipmapOptions | boolean;
    compress?: CompressOptions | boolean;
}

export interface MipmapCompressImageData
{
    format: '.avif' | '.png' | '.webp' | '.jpg' | '.jpeg';
    resolution: number;
    sharpImage: sharp.Sharp;
}

const defaultMipmapOptions: Required<MipmapOptions> = {
    template: '@%%x',
    resolutions: { default: 1 },
    fixedResolution: 'default'
};

export function mipmapCompress(_options: MipmapCompressOptions = {}): AssetPipe<MipmapCompressOptions>
{
    const mipmap = resolveOptions(_options.mipmap, {
        template: '@%%x',
        resolutions: { default: 1, low: 0.5 },
        fixedResolution: 'default'
    });

    const compress = resolveOptions<CompressOptions>(_options.compress, {
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
        mipmap,
        compress,
        tags: {
            fix: 'fix',
            nc: 'nc',
            ..._options.tags,
        }
    };

    return {
        folder: true,
        name: 'mip-compress',
        defaultOptions,
        test(asset: Asset, options)
        {
            return (options.mipmap || options.compress) && checkExt(asset.path, '.png', '.jpg', '.jpeg');
        },
        async transform(asset: Asset, options)
        {
            const mip =  options.mipmap && !asset.metaData[options.tags.fix as any];

            const compress = options.compress && !asset.metaData[options.tags.nc as any];

            let processedImages: MipmapCompressImageData[];

            const image: MipmapCompressImageData = {
                format: asset.extension as MipmapCompressImageData['format'],
                resolution: 1,
                sharpImage: sharp(asset.path),
            };

            // first mipmap if we want..
            try
            {
                if (mip)
                {
                    const { resolutions, fixedResolution } = options.mipmap as Required<MipmapOptions>
                        || defaultMipmapOptions;

                    const fixedResolutions: {[x: string]: number} = {};

                    fixedResolutions[fixedResolution] = resolutions[fixedResolution];

                    const resolutionHash = asset.allMetaData[options.tags.fix as any]
                        ? fixedResolutions
                        : resolutions;

                    const largestResolution = Math.max(...Object.values(resolutionHash));

                    image.resolution = largestResolution;

                    processedImages = mip ? await mipmapSharp(image, resolutionHash, largestResolution) : [image];
                }
                else
                {
                    processedImages = [image];
                }
            }
            catch (error)
            {
                throw new Error(`[AssetPack] Failed to mipmap image: ${asset.path} - ${error}`);
            }

            try
            {
                // then compress them if we want
                processedImages = compress
                    ? processedImages.map((image) => compressSharp(image, options.compress as CompressOptions)).flat()
                    : processedImages;
            }
            catch (error)
            {
                throw new Error(`[AssetPack] Failed to compress image: ${asset.path} - ${error}`);
            }

            // now create our new assets
            const newAssets = processedImages.map((data) =>
            {
                let resolution = '';

                if (options.mipmap)
                {
                    resolution = (options.mipmap as Required<MipmapOptions>).template.replace('%%', `${data.resolution}`);
                    resolution = data.resolution === 1 ? '' : resolution;
                }

                const end = `${resolution}${data.format}`;
                const filename = asset.filename
                    .replace(/\.[^/.]+$/, end);

                const newAsset = createNewAssetAt(
                    asset,
                    filename
                );

                return newAsset;
            });

            // and finally write them to disk
            const promises = processedImages.map((image, i) => image.sharpImage.toBuffer().then((buffer) =>
            {
                newAssets[i].buffer = buffer;
            }));

            await Promise.all(promises);

            return newAssets;
        },

    };
}

