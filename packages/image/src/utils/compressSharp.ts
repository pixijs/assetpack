import type { AvifOptions, WebpOptions, JpegOptions, PngOptions } from 'sharp';
import type { CompressImageData, CompressOptions } from '../compress';

export async function compressSharp(
    image: CompressImageData,
    options: CompressOptions
): Promise<CompressImageData[]>
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

    return compressed;
}
