import type { AvifOptions, JpegOptions, PngOptions, WebpOptions } from 'sharp';
import type { CompressImageData, CompressImageDataResult, CompressOptions } from '../compress.js';

export async function compressSharp(
    image: CompressImageData,
    options: CompressOptions
): Promise<CompressImageDataResult[]>
{
    const compressed: CompressImageDataResult[] = [];

    const sharpImage = image.sharpImage;

    if (image.format === '.png' && options.png)
    {
        compressed.push({
            format: '.png',
            resolution: image.resolution,
            buffer: await sharpImage.clone().png({ ...options.png as PngOptions, force: true }).toBuffer(),
        });
    }

    if (options.webp)
    {
        compressed.push({
            format: '.webp',
            resolution: image.resolution,
            buffer: await sharpImage.clone().webp(options.webp as WebpOptions).toBuffer()
        });
    }

    if (((image.format === '.jpg') || (image.format === '.jpeg')) && options.jpg)
    {
        compressed.push({
            format: '.jpg',
            resolution: image.resolution,
            buffer: await sharpImage.clone().jpeg(options.jpg as JpegOptions).toBuffer()
        });
    }

    if (options.avif)
    {
        compressed.push({
            format: '.avif',
            resolution: image.resolution,
            buffer: await sharpImage.clone().avif(options.avif as AvifOptions).toBuffer()
        });
    }

    return compressed;
}
