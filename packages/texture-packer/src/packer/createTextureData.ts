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
            throw new Error(`[Assetpack][packTextures] Could not get metadata for ${texture.path}`);
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

        let result = await sharpImage.toBuffer({ resolveWithObject: true }).catch((error) =>
        {
            // eslint-disable-next-line max-len
            console.warn(`[Assetpack][packTextures] Failed to process texture: ${texture.path} - ${error}, using empty pixel texture instead.`);

            return { data: null, info: null };
        });

        if (!result.data || !result.info)
        {
            const buffer = Buffer.alloc(4);

            const emptyPixelTexture = sharp(buffer, {
                raw: {
                    width: 1,
                    height: 1,
                    channels: 4
                }
            });

            result = await emptyPixelTexture.png().toBuffer({ resolveWithObject: true });
        }

        const { data: buffer, info } = result;

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
