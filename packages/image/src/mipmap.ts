import sharp from 'sharp';
import { mipmapSharp } from './utils/mipmapSharp';
import { resolveOptions } from './utils/resolveOptions';
import { checkExt, createNewAssetAt } from '@play-co/assetpack-core';

import type { CompressImageData } from './compress';
import type { Asset, AssetPipe, PluginOptions } from '@play-co/assetpack-core';

export interface MipmapOptions<T extends string = ''> extends PluginOptions<'fix' | T>
{
    /** A template for denoting the resolution of the images. */
    template?: string;
    /** An object containing the resolutions that the images will be resized to. */
    resolutions?: {[x: string]: number};
    /** A resolution used if the fixed tag is applied. Resolution must match one found in resolutions. */
    fixedResolution?: string;
}

const defaultMipmapOptions: Required<MipmapOptions> = {
    template: '@%%x',
    resolutions: { default: 1, low: 0.5 },
    fixedResolution: 'default',
    tags: {
        fix: 'fix',
    }
};

export function mipmap(_options: MipmapOptions = {}): AssetPipe<MipmapOptions>
{
    const mipmap = resolveOptions(_options, defaultMipmapOptions);

    const defaultOptions = {
        ...mipmap,
        tags: {
            fix: 'fix',
            ..._options.tags,
        }
    };

    return {
        folder: true,
        name: 'mipmap',
        defaultOptions,
        test(asset: Asset, options)
        {
            return options && checkExt(asset.path, '.png', '.jpg', '.jpeg');
        },
        async transform(asset: Asset, options)
        {
            const shouldMipmap = mipmap && !asset.metaData[options.tags.fix as any];

            let processedImages: CompressImageData[];

            const image: CompressImageData = {
                format: asset.extension as CompressImageData['format'],
                resolution: 1,
                sharpImage: sharp(asset.buffer),
            };

            try
            {
                if (shouldMipmap)
                {
                    const { resolutions, fixedResolution } = options as Required<MipmapOptions>
                        || defaultOptions;

                    const fixedResolutions: {[x: string]: number} = {};

                    fixedResolutions[fixedResolution] = resolutions[fixedResolution];

                    const resolutionHash = asset.allMetaData[options.tags.fix as any]
                        ? fixedResolutions
                        : resolutions;

                    const largestResolution = Math.max(...Object.values(resolutionHash));

                    image.resolution = largestResolution;

                    processedImages = shouldMipmap ? await mipmapSharp(image, resolutionHash, largestResolution) : [image];
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

            // now create our new assets
            const newAssets = processedImages.map((data) =>
            {
                let resolution = '';

                if (options)
                {
                    resolution = (options as Required<MipmapOptions>).template.replace('%%', `${data.resolution}`);
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

            const promises = processedImages.map((image, i) => image.sharpImage.toBuffer().then((buffer) =>
            {
                newAssets[i].buffer = buffer;
            }));

            await Promise.all(promises);

            return newAssets;
        },

    };
}

