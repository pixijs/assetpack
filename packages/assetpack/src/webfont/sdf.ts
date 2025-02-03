import fs from 'fs-extra';
import generateBMFont from 'msdf-bmfont-xml';
import { json2xml, xml2json } from 'xml-js';
import { checkExt, createNewAssetAt, path, stripTags } from '../core/index.js';

import type { BitmapFontOptions } from 'msdf-bmfont-xml';
import type { Asset, AssetPipe, PluginOptions } from '../core/index.js';
import type { MipmapOptions } from '../image/index.js';

export interface SDFFontOptions extends PluginOptions
{
    name: string,
    type: BitmapFontOptions['fieldType'],
    font?: Omit<BitmapFontOptions, 'outputType' | 'fieldType'>,
    resolutionOptions?: MipmapOptions
}

function signedFont(
    defaultOptions: SDFFontOptions,
): AssetPipe<SDFFontOptions, 'font' | 'nc' | 'fix'>
{
    return {
        folder: false,
        name: defaultOptions.name,
        defaultOptions: {
            ...defaultOptions,
            resolutionOptions: {
                template: '@%%x',
                resolutions: { default: 1 },
                fixedResolution: 'default',
                ...defaultOptions.resolutionOptions,
            },
            font: {
                fontSize: 42,
                textureSize: [512, 512],
                ...defaultOptions.font,
            },
        },
        tags: {
            font: 'font',
            nc: 'nc',
            fix: 'fix',
        },
        test(asset: Asset)
        {
            return asset.allMetaData[this.tags!.font] && checkExt(asset.path, '.ttf', '.fnt', '.xml', '.png');
        },
        async transform(asset: Asset, options)
        {
            if (!checkExt(asset.filename, '.ttf'))
            {
                asset.metaData[this.tags!.fix] = true;

                return [asset];
            }
            const { resolutionOptions } = options;

            const fixedResolutions: { [x: string]: number } = {};

            fixedResolutions[resolutionOptions.fixedResolution] = resolutionOptions.resolutions[
                resolutionOptions.fixedResolution];

            const largestResolution = Math.max(...Object.values(resolutionOptions.resolutions));
            const resolutionHash = asset.allMetaData[this.tags!.fix] ? fixedResolutions : resolutionOptions.resolutions;

            const assets: Asset[] = [];

            const promises: Promise<void>[] = [];

            Object.values(resolutionHash)
                .sort((a, b) => b - a)
                .forEach((resolution) =>
                {
                    promises.push((async () =>
                    {
                        const scale = resolution / largestResolution;

                        const newFileName = createName(stripTags(asset.filename.replace(/\.(ttf)$/i, '')), resolution, resolutionOptions.template);

                        // set the family name to the filename if it doesn't exist
                        asset.metaData.family ??= stripTags(path.trimExt(asset.filename));
                        const {
                            font,
                            textures,
                        } = await GenerateFont(asset.path, {

                            ...options.font,
                            filename: `${newFileName}.png`,
                            fieldType: options.type,
                            outputType: 'xml',
                            fontSize: Math.round(options.font.fontSize * scale),
                            textureSize: [Math.round(options.font.textureSize[0] * scale), Math.round(options.font.textureSize[1] * scale)],
                        });

                        textures.forEach(({
                            filename,
                            texture,
                        }) =>
                        {
                            const newTextureName = `${filename}.png`;

                            const newTextureAsset = createNewAssetAt(asset, newTextureName);

                            // don't compress!
                            newTextureAsset.metaData[this.tags!.nc] = asset.rootTransformAsset.allMetaData[this.tags!.nc];
                            newTextureAsset.metaData[this.tags!.fix] = true;
                            newTextureAsset.metaData.mIgnore = true;

                            assets.push(newTextureAsset);

                            newTextureAsset.buffer = texture;
                        });

                        const newFontAsset = createNewAssetAt(asset, `${newFileName}.fnt`);
                        const fntJson: jsonType = JSON.parse(xml2json(font.data, { compact: true }));

                        fntJson.font.info._attributes.face = asset.metaData.family;

                        newFontAsset.buffer = Buffer.from(json2xml(JSON.stringify(fntJson), {
                            compact: true,
                            spaces: 4,
                        }));
                        newFontAsset.metaData[this.tags!.font] = true;

                        assets.push(newFontAsset);
                    })());
                });

            await Promise.all(promises);

            return assets;
        },
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
                resolve({
                    textures,
                    font,
                });
            }
        });
    });
}

export function createName(
    name: string,
    scale: number,
    template: string,
): string
{
    const scaleLabel = scale !== 1 ? template.replace('%%', scale.toString()) : '';

    return `${name}${scaleLabel}`;
}

export type jsonType = {
    font: {
        info: {
            _attributes: {
                face: string,
                size: string,
                bold: string
            }
        },
        pages: {
            page: pageType | pageType[]
        }
    }
};
export type pageType = {
    _attributes: {
        id: string
        file: string,
    },
};
