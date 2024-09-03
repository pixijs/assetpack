import fs from 'fs-extra';
import generateBMFont from 'msdf-bmfont-xml';
import { checkExt, createNewAssetAt, path, stripTags } from '../core/index.js';

import type { BitmapFontOptions } from 'msdf-bmfont-xml';
import type { Asset, AssetPipe, PluginOptions } from '../core/index.js';

export interface SDFFontOptions extends PluginOptions
{
    name: string,
    type: BitmapFontOptions['fieldType'],
    font?: Omit<BitmapFontOptions, 'outputType' | 'fieldType'>;
}

function signedFont(
    defaultOptions: SDFFontOptions
): AssetPipe<SDFFontOptions, 'font' | 'nc' | 'fix'>
{
    return {
        folder: false,
        name: defaultOptions.name,
        defaultOptions,
        tags: {
            font: 'font',
            nc: 'nc',
            fix: 'fix',
        },
        test(asset: Asset)
        {
            return asset.allMetaData[this.tags!.font] && checkExt(asset.path, '.ttf');
        },
        async transform(asset: Asset, options)
        {
            const newFileName = stripTags(asset.filename.replace(/\.(ttf)$/i, ''));

            // set the family name to the filename if it doesn't exist
            asset.metaData.family ??= path.trimExt(asset.filename);
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
                newTextureAsset.metaData[this.tags!.nc] = true;
                newTextureAsset.metaData[this.tags!.fix] = true;
                newTextureAsset.metaData.mIgnore = true;

                assets.push(newTextureAsset);

                newTextureAsset.buffer = texture;
            });

            const newFontAsset = createNewAssetAt(asset, font.filename);

            assets.push(newFontAsset);

            newFontAsset.buffer = Buffer.from(font.data);

            await Promise.all(promises);

            return assets;
        }
    };
}

export function sdfFont(options: Partial<SDFFontOptions> = {})
{
    const signed = signedFont({
        name: 'sdf-font',
        type: 'sdf',
        ...options,
    });

    signed.tags!.font = 'sdf';

    return signed;
}

export function msdfFont(options: Partial<SDFFontOptions> = {})
{
    const signed = signedFont({
        name: 'msdf-font',
        type: 'msdf',
        ...options,
    });

    signed.tags!.font = 'msdf';

    return signed;
}

async function GenerateFont(input: string, params: BitmapFontOptions): Promise<{
    textures: { filename: string, texture: Buffer }[],
    font: { filename: string, data: string }
}>
{
    return new Promise(async (resolve, reject) =>
    {
        const fontBuffer = await fs.readFile(input);

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
