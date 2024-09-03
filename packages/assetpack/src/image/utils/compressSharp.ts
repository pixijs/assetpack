import type { AvifOptions, JpegOptions, PngOptions, WebpOptions } from 'sharp';
import type { CompressImageData, CompressImageDataResult, CompressOptions } from '../compress.js';

export async function compressSharp(
    image: CompressImageData,
    options: CompressOptions
): Promise<CompressImageDataResult[]>
{
    const compressed: CompressImageData[] = [];
    const sharpImage = image.sharpImage;

    if (image.format === '.png' && options.png)
    {
        compressed.push({
            format: '.png',
            resolution: image.resolution,
            sharpImage: sharpImage.clone().png({ ...options.png as PngOptions, force: true }),
        });
    }

    if (options.webp)
    {
        compressed.push({
            format: '.webp',
            resolution: image.resolution,
            sharpImage: sharpImage.clone().webp(options.webp as WebpOptions)
        });
    }

    if (((image.format === '.jpg') || (image.format === '.jpeg')) && options.jpg)
    {
        compressed.push({
            format: '.jpg',
            resolution: image.resolution,
            sharpImage: sharpImage.clone().jpeg(options.jpg as JpegOptions)
        });
    }

    if (options.avif)
    {
        compressed.push({
            format: '.avif',
            resolution: image.resolution,
            sharpImage: sharpImage.clone().avif(options.avif as AvifOptions)
        });
    }

    const results = await Promise.all(compressed.map(async (result) => ({
        ...result,
        buffer: await result.sharpImage.toBuffer()
    })));

    return results;
}
