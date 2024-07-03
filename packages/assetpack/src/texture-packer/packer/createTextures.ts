import sharp from 'sharp';

import type { PackTexturesOptions, PixiPacker } from './packTextures.js';

export async function createTextures(
    packer: PixiPacker,
    width: number,
    height: number,
    options: Required<PackTexturesOptions>
)
{
    const texturePromises: Promise<{ name: string; buffer: Buffer; }>[] = [];

    const bins = packer.bins;

    for (let i = 0; i < bins.length; i++)
    {
        const bin = bins[i];

        const compositeOptions = [];

        for (let j = 0; j < bin.rects.length; j++)
        {
            const rect = bin.rects[j];

            if (!rect.rot)
            {
                const input = rect.textureData.buffer;

                compositeOptions.push({
                    input,
                    left: rect.x,
                    top: rect.y,
                });
            }

            else
            {
                const input = await sharp(rect.textureData.buffer)
                    .rotate(90, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .toBuffer();

                compositeOptions.push({
                    input,
                    left: rect.x,
                    top: rect.y,
                });
            }
        }

        let compositeTexture = sharp({
            create: {
                width,
                height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            }
        })
            .composite(compositeOptions);

        compositeTexture = options.textureFormat === 'png' ? compositeTexture.png() : compositeTexture.jpeg();

        texturePromises.push(compositeTexture.toBuffer().then((buffer) => ({
            name: createName(
                options.textureName,
                i,
                bins.length !== 1,
                options.resolution,
                options.textureFormat
            ),
            buffer
        })));
    }

    return await Promise.all(texturePromises);
}

export function createName(
    name: string,
    page: number,
    paginate: boolean,
    scale: number,
    format: string
): string
{
    const pageLabel = (!paginate) ? '' : `-${page}`;
    const scaleLabel = scale !== 1 ? `@${scale}x` : '';

    return `${name}${pageLabel}${scaleLabel}.${format}`;
}
