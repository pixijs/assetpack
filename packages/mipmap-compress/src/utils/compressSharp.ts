import type { AvifOptions, PngOptions, WebpOptions, JpegOptions } from 'sharp';
import type { MipmapCompressImageData, CompressOptions } from '../mipmapCompress';

export function compressSharp(image: MipmapCompressImageData, options: CompressOptions): MipmapCompressImageData[]
{
    const compressed: MipmapCompressImageData[] = [];

    const sharpImage = image.sharpImage;

    if (((image.format === '.jpg') || (image.format === '.jpeg')) && options.jpg)
    {
        compressed.push({
            format: '.jpg',
            resolution: image.resolution,
            sharpImage: sharpImage.jpeg(options.jpg as JpegOptions)
        });
    }

    if (options.avif)
    {
        compressed.push({
            format: '.avif',
            resolution: image.resolution,
            sharpImage: sharpImage.avif(options.avif as AvifOptions)
        });
    }

    if (options.webp)
    {
        compressed.push({
            format: '.webp',
            resolution: image.resolution,
            sharpImage: sharpImage.webp(options.webp as WebpOptions)
        });
    }

    if (image.format === '.png' && options.png)
    {
        compressed.push({
            format: '.png',
            resolution: image.resolution,
            sharpImage: sharpImage.png(options.png as PngOptions)
        });
    }

    return compressed;
}
