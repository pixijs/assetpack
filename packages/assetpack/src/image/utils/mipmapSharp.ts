import type { CompressImageData } from '../compress.js';

export async function mipmapSharp(
    image: CompressImageData,
    resolutionHash: { [x: string]: number },
    largestResolution: number,
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
                }),
            });
        }
    }

    return output;
}
