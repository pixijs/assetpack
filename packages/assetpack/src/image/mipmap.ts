import sharp from 'sharp';
import { checkExt, createNewAssetAt } from '../core/index.js';
import { mipmapSharp } from './utils/mipmapSharp.js';
import { resolveOptions } from './utils/resolveOptions.js';

import type { Asset, AssetPipe, PluginOptions } from '../core/index.js';
import type { CompressImageData } from './compress.js';
import type { SharpProcessingOptions } from './types.js';

export interface MipmapOptions extends PluginOptions {
    /** A template for denoting the resolution of the images. */
    template?: string;
    /** An object containing the resolutions that the images will be resized to. */
    resolutions?: { [x: string]: number };
    /** A resolution used if the fixed tag is applied. Resolution must match one found in resolutions. */
    fixedResolution?: string;
    /** Options to pass to sharp for processing the images. */
    sharpOptions?: SharpProcessingOptions;
}

export type MipmapTags = 'fix' | 'nomip';

const defaultMipmapOptions: Required<MipmapOptions> = {
    template: '@%%x',
    resolutions: { default: 1, low: 0.5 },
    fixedResolution: 'default',
    sharpOptions: {},
};

export function mipmap(defaultOptions: MipmapOptions = {}): AssetPipe<MipmapOptions, MipmapTags> {
    const mipmap = resolveOptions(defaultOptions, defaultMipmapOptions);

    return {
        folder: true,
        name: 'mipmap',
        defaultOptions: {
            ...mipmap,
        },
        tags: {
            fix: 'fix',
            nomip: 'nomip',
        },
        test(asset: Asset, options) {
            const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];
            return options && checkExt(asset.path, ...extensions) && !asset.allMetaData[this.tags!.nomip];
        },
        async transform(asset: Asset, options) {
            const shouldMipmap = mipmap && !asset.allMetaData[this.tags!.fix];

            let processedImages: CompressImageData[];

            const image: CompressImageData = {
                format: asset.extension as CompressImageData['format'],
                resolution: 1,
                sharpImage: sharp(asset.buffer),
            };

            const { resolutions, fixedResolution, sharpOptions } =
                (options as Required<MipmapOptions>) || this.defaultOptions;

            const fixedResolutions = {
                [fixedResolution]: resolutions[fixedResolution],
            };

            const largestResolution = Math.max(...Object.values(resolutions));

            try {
                if (shouldMipmap) {
                    const resolutionHash = asset.allMetaData[this.tags!.fix] ? fixedResolutions : resolutions;

                    image.resolution = largestResolution;

                    processedImages = await mipmapSharp(image, resolutionHash, largestResolution, sharpOptions);
                } else {
                    image.resolution = fixedResolutions[fixedResolution];

                    processedImages =
                        image.resolution === 1
                            ? [image]
                            : (processedImages = await mipmapSharp(
                                  image,
                                  fixedResolutions,
                                  largestResolution,
                                  sharpOptions,
                              ));
                }
            } catch (error) {
                throw new Error(`[AssetPack][mipmap] Failed to mipmap image: ${asset.path} - ${error}`);
            }

            // now create our new assets
            const newAssets = processedImages.map((data) => {
                let resolution = '';

                if (options) {
                    resolution = (options as Required<MipmapOptions>).template.replace('%%', `${data.resolution}`);
                    resolution = data.resolution === 1 ? '' : resolution;
                }

                const end = `${resolution}${data.format}`;
                const filename = asset.filename.replace(/\.[^/.]+$/, end);

                const newAsset = createNewAssetAt(asset, filename);

                return newAsset;
            });

            const promises = processedImages.map((image, i) =>
                image.sharpImage.toBuffer().then((buffer) => {
                    newAssets[i].buffer = buffer;
                }),
            );

            await Promise.all(promises);

            return newAssets;
        },
    };
}
