import sharp from 'sharp';
import type { PackTexturesOptions, PixiRectData, TextureData } from './packTextures';
import { MaxRectsPacker } from 'maxrects-packer';

export async function createTextureData(options: Required<PackTexturesOptions>)
{
    const packer = new MaxRectsPacker<PixiRectData>(options.width, options.height, options.padding, {
        smart: true,
        pot: options.powerOfTwo,
        border: options.padding,
        allowRotation: options.allowRotation,
    });

    const scale = options.scale;

    const textureDatas =  await Promise.all(options.texturesToPack.map(async (texture) =>
    {
        let sharpImage = sharp(texture.contents);

        const metaData = await sharpImage.metadata();

        if (!metaData.width || !metaData.height)
        {
            throw new Error(`[packTextures] Could not get metadata for ${texture.path}`);
        }

        const newWidth = Math.ceil(metaData.width * scale);
        const newHeight = Math.ceil(metaData.height * scale);

        if (scale < 1)
        {
            sharpImage = sharpImage
                .resize({
                    width: newWidth,
                    height: newHeight,
                });

            // this is a bug work around for sharp
            // it should be able to chain together resize and trim
            // but it doesn't work
            if (options.allowTrim)
            {
                sharpImage = sharp(await sharpImage.toBuffer());
            }
        }

        if (options.allowTrim)
        {
            sharpImage = sharpImage
                .trim({
                    threshold: options.alphaThreshold,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                });
        }

        const { buffer, info } = await new Promise<{ buffer: Buffer; info: sharp.OutputInfo; }>((resolve) =>
        {
            sharpImage
                .toBuffer((_error, buffer, info) =>
                {
                    resolve({ buffer, info });
                });
        });

        const trimmed = (info.width < newWidth || info.height < newHeight);

        const textureData: TextureData = {
            buffer,
            originalWidth: newWidth,
            originalHeight: newHeight,
            width: info.width,
            height: info.height,
            trimOffsetLeft: -(info.trimOffsetLeft ?? 0),
            trimOffsetTop: -(info.trimOffsetTop ?? 0),
            path: texture.path,
            trimmed,
        };

        return textureData;
    }));

    textureDatas.forEach((textureData) =>
    {
        packer.add({
            width: textureData.width,
            height: textureData.height,
            path: textureData.path,
            textureData,
        } as any);
    });

    return packer;
}
