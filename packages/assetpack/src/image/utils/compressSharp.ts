import { BYPASS } from '../constants.js';

import type { AvifOptions, JpegOptions, PngOptions, WebpOptions } from 'sharp';
import type { CompressImageData, CompressOptions } from '../compress.js';


export async function compressSharp(
    image: CompressImageData,
    options: CompressOptions
): Promise<CompressImageData[]>
{
    const compressed: CompressImageData[] = [];

    const sharpImage = image.sharpImage;

    if (image.format === '.png' && options.png && options.png !== BYPASS)
    {
        compressed.push({
            format: '.png',
            resolution: image.resolution,
            sharpImage: sharpImage.clone().png({ ...options.png as PngOptions, force: true }),
        });
    }

    if (options.webp && options.webp !== BYPASS)
    {
        compressed.push({
            format: '.webp',
            resolution: image.resolution,
            sharpImage: sharpImage.clone().webp(options.webp as WebpOptions)
        });
    }

    if (((image.format === '.jpg') || (image.format === '.jpeg')) && options.jpg && options.jpg !== BYPASS)
    {
        compressed.push({
            format: '.jpg',
            resolution: image.resolution,
            sharpImage: sharpImage.clone().jpeg(options.jpg as JpegOptions)
        });
    }

    if (options.avif && options.avif !== BYPASS)
    {
        compressed.push({
            format: '.avif',
            resolution: image.resolution,
            sharpImage: sharpImage.clone().avif(options.avif as AvifOptions)
        });
    }

    return compressed;
}
