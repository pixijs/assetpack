import type { AssetPipe, PluginOptions } from '@assetpack/core';
import { multiPipe  } from '@assetpack/core';
import type { WebpOptions, PngOptions, AvifOptions, JpegOptions } from 'sharp';
import { compressAvif } from './compressAvif';
import { compressJpg } from './compressJpg';
import { compressWebp } from './compressWebp';
import { compressPng } from './compressPng';

export interface CompressOptions extends PluginOptions<'nc'>
{
    webp?: Omit<WebpOptions, 'force'> | false
    png?: Omit<PngOptions, 'force'> | false
    avif?: Omit<AvifOptions, 'force'> | false
    jpg?: Omit<JpegOptions, 'force'> | false
}

// converts png, jpg, jpeg
export function compress(options: Partial<CompressOptions> = {}): AssetPipe
{
    const tags = {
        nc: 'nc',
        ...options?.tags
    };

    const compressionPipes = [
        ...(options.png === false ? [] : [compressPng({ compression: options.png, tags })]),
        ...(options.jpg === false ? [] : [compressJpg({ compression: options.jpg, tags })]),
        ...(options.webp === false ? [] : [compressWebp({ compression: options.webp, tags })]),
        ...(options.avif === false ? [] : [compressAvif({ compression: options.avif, tags })])
    ];

    return multiPipe({
        pipes: compressionPipes,
        name: 'compress'
    });
}

