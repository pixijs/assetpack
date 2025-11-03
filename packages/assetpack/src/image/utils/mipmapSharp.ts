import type { CompressImageData } from '../compress.js';
import type { SharpProcessingOptions } from '../types.js';

/**
 * Generates mipmaps (multiple resolution versions) of an image using Sharp.
 *
 * This function creates different scaled versions of an image based on the provided
 * resolution hash. It maintains the original image for the largest resolution and
 * creates resized copies for smaller resolutions.
 *
 * @param image - The source image data containing Sharp image instance and format
 * @param resolutionHash - Object mapping resolution names to their pixel values
 * @param largestResolution - The maximum resolution value used as base for scaling
 * @param sharpOptions - Sharp processing options including resize configuration
 * @returns Promise resolving to array of CompressImageData objects, each representing a different resolution
 */
export async function mipmapSharp(
    image: CompressImageData,
    resolutionHash: { [x: string]: number },
    largestResolution: number,
    sharpOptions: SharpProcessingOptions,
): Promise<CompressImageData[]> {
    const sharpImage = image.sharpImage;

    const metadata = await sharpImage.metadata();

    const { width, height } = metadata;

    const output: CompressImageData[] = [];

    if (width && height) {
        for (const i in resolutionHash) {
            const scale = resolutionHash[i] / largestResolution;

            if (scale === 1) {
                image.resolution = resolutionHash[i];
                output.push(image);
                continue;
            }

            output.push({
                format: image.format,
                resolution: resolutionHash[i],
                sharpImage: sharpImage.clone().resize({
                    width: Math.round(width * scale),
                    height: Math.round(height * scale),
                    ...sharpOptions.resize,
                }),
            });
        }
    }

    return output;
}
