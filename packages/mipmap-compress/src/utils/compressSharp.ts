import type { AvifOptions, WebpOptions, JpegOptions, PngOptions } from 'sharp';
import type { MipmapCompressImageData, CompressOptions } from '../mipmapCompress';
import sharp from 'sharp';

export async function compressSharp(
    image: MipmapCompressImageData,
    options: CompressOptions
): Promise<MipmapCompressImageData[]>
{
    const compressed: MipmapCompressImageData[] = [];

    let sharpImage = image.sharpImage;

    if (image.format === '.png' && options.png)
    {
        // optimising the PNG image and using that as the source of the WebP and AVIF images
        // will result in a smaller file size and increase the speed of the compression.
        sharpImage = sharp(await image.sharpImage.png({ ...options.png as PngOptions, force: true }).toBuffer());

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
