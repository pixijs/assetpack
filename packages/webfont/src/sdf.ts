// ////ts-nocheck
import type { AssetPipe, Asset, PluginOptions } from '@assetpack/core';
import { checkExt, createNewAssetAt, stripTags } from '@assetpack/core';
import type { BitmapFontOptions } from 'msdf-bmfont-xml';
import generateBMFont from 'msdf-bmfont-xml';
import { readFile, writeFile } from 'fs-extra';

export interface SDFFontOptions extends PluginOptions<'sdf'>
{
    name: string,
    type: BitmapFontOptions['fieldType'],
    font: Omit<BitmapFontOptions, 'outputType' | 'fieldType'>;
}

export function signedFont(
    options: SDFFontOptions
): AssetPipe
{
    const tag = options.type as string;

    return {
        folder: false,
        name: options.name,
        test(asset: Asset)
        {
            return asset.allMetaData[tag] && checkExt(asset.path, '.ttf');
        },
        async transform(asset: Asset)
        {
            const newFileName = stripTags(asset.filename.replace(/\.(ttf)$/i, ''));

            const { font, textures } = await GenerateFont(asset.path, {
                ...options.font,
                filename: newFileName,
                fieldType: options.type,
                outputType: 'xml',
            });

            const assets: Asset[] = [];
            const promises: Promise<void>[] = [];

            textures.forEach(({ filename, texture }) =>
            {
                const newTextureName = `${filename}.png`;

                const newTextureAsset = createNewAssetAt(asset, newTextureName);

                // don't compress!
                newTextureAsset.metaData.nc = true;
                newTextureAsset.metaData.fix = true;

                assets.push(newTextureAsset);

                promises.push(writeFile(newTextureAsset.path, texture));
            });

            const newFontAsset = createNewAssetAt(asset, font.filename);

            assets.push(newFontAsset);

            promises.push(writeFile(newFontAsset.path, font.data, 'utf8'));

            await Promise.all(promises);

            return assets;
        }
    };
}

export function sdfFont(options: Partial<SDFFontOptions> = {}): AssetPipe
{
    return signedFont({
        name: 'sdf-font',
        type: 'sdf',
        ...options
    });
}

export function msdfFont(options?: Partial<SDFFontOptions>): AssetPipe
{
    return signedFont({
        name: 'msdf-font',
        type: 'msdf',
        ...options,
    });
}

async function GenerateFont(input: string, params: BitmapFontOptions): Promise<{
    textures: { filename: string, texture: Buffer }[],
    font: { filename: string, data: string }
}>
{
    return new Promise(async (resolve, reject) =>
    {
        const fontBuffer = await readFile(input);

        generateBMFont(fontBuffer, params, (err, textures, font) =>
        {
            if (err)
            {
                reject(err);
            }
            else
            {
                resolve({ textures, font });
            }
        });
    });
}
