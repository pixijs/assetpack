import sharp from 'sharp';
import { checkExt, createNewAssetAt } from '../core/index.js';
import { compressGpuTextures } from './utils/compressGpuTextures.js';
import { compressSharp } from './utils/compressSharp.js';
import { resolveOptions } from './utils/resolveOptions.js';

import type { AstcOptions, BasisOptions, BcOptions, EtcOptions } from 'gpu-tex-enc';
import type { AvifOptions, JpegOptions, PngOptions, WebpOptions } from 'sharp';
import type { Asset, AssetPipe, PluginOptions } from '../core/index.js';

type CompressJpgOptions = Omit<JpegOptions, 'force'>;
type CompressWebpOptions = Omit<WebpOptions, 'force'>;
type CompressAvifOptions = Omit<AvifOptions, 'force'>;
type CompressPngOptions = Omit<PngOptions, 'force'>;
type CompressBc7Options = BcOptions;
type CompressAstcOptions = AstcOptions;
type CompressBasisOptions = BasisOptions;
type CompressEtcOptions = EtcOptions;

export interface CompressOptions extends PluginOptions {
    png?: CompressPngOptions | boolean;
    webp?: CompressWebpOptions | boolean;
    avif?: CompressAvifOptions | boolean;
    jpg?: CompressJpgOptions | boolean;
    bc7?: CompressBc7Options | boolean;
    astc?: CompressAstcOptions | boolean;
    basis?: CompressBasisOptions | boolean;
    etc?: CompressEtcOptions | boolean;
}

export interface CompressImageData {
    format: '.avif' | '.png' | '.webp' | '.jpg' | '.jpeg';
    resolution: number;
    sharpImage: sharp.Sharp;
}

export interface CompressImageDataResult {
    format: CompressImageData['format'] | '.bc7.dds' | '.astc.ktx' | '.basis.ktx2' | '.etc.ktx';
    resolution: number;
    buffer: Buffer;
}

export type CompressTags = 'nc';

export function compress(options: CompressOptions = {}): AssetPipe<CompressOptions, CompressTags> {
    const compress = resolveOptions<CompressOptions>(options, {
        png: true,
        jpg: true,
        webp: true,
        avif: false,
        bc7: false,
        astc: false,
        basis: false,
        etc: false,
    });

    if (compress) {
        compress.jpg = resolveOptions<CompressJpgOptions>(compress.jpg, {});
        compress.png = resolveOptions<CompressPngOptions>(compress.png, {
            quality: 90,
        });
        compress.webp = resolveOptions<CompressWebpOptions>(compress.webp, {
            quality: 80,
            alphaQuality: 80,
        });
        compress.avif = resolveOptions<CompressAvifOptions>(compress.avif, {});

        compress.bc7 = resolveOptions<CompressBc7Options>(compress.bc7, {});

        compress.astc = resolveOptions<CompressAstcOptions>(compress.astc, {});

        compress.basis = resolveOptions<CompressBasisOptions>(compress.basis, {});

        compress.etc = resolveOptions<CompressEtcOptions>(compress.etc, {});
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
        test(asset: Asset, options) {
            return options && checkExt(asset.path, '.png', '.jpg', '.jpeg') && !asset.allMetaData[this.tags!.nc];
        },
        async transform(asset: Asset, options) {
            const shouldCompress = compress && !asset.metaData[this.tags!.nc];

            if (!shouldCompress) {
                return [];
            }

            try {
                const image: CompressImageData = {
                    format: asset.extension as CompressImageData['format'],
                    resolution: 1,
                    sharpImage: sharp(asset.buffer),
                };

                const processedImages: CompressImageDataResult[] = [
                    ...(await compressSharp(image, options)),
                    ...(await compressGpuTextures(image, options)),
                ];

                const newAssets = processedImages.map((data) => {
                    const end = `${data.format}`;
                    const filename = asset.filename.replace(/\.[^/.]+$/, end);

                    const newAsset = createNewAssetAt(asset, filename);

                    newAsset.buffer = data.buffer;

                    return newAsset;
                });

                // ensure that the original image is passed through if it is not compressed by png/jpg options
                if (
                    (image.format === '.png' && !options.png) ||
                    ((image.format === '.jpg' || image.format === '.jpeg') && !options.jpg)
                ) {
                    newAssets.push(asset);
                }

                return newAssets;
            } catch (error) {
                throw new Error(`[AssetPack][compress] Failed to compress image: ${asset.path} - ${error}`);
            }
        },
    };
}
