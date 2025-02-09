import fs from 'fs-extra';
import { glob } from 'glob';
import { BuildReporter, checkExt, createNewAssetAt, findAssets, merge, path, stripTags } from '../core/index.js';
import { packTextures } from '../texture-packer/packer/packTextures.js';

import type { Asset, AssetPipe, PluginOptions } from '../core/index.js';
import type { MipmapOptions } from '../image/index.js';
import type { PackTexturesOptions } from '../texture-packer/packer/packTextures.js';

export type fntOptionFont = {
    textureSize?: [number, number],
    texturePadding?: number,
    pot?: boolean,
};

export interface fntOptions extends PluginOptions
{
    font?: fntOptionFont,
    resolutionOptions?: MipmapOptions
}

export function fntWithPic(defaultOptions: Partial<fntOptions> = {}): AssetPipe<fntOptions, 'fnt' | 'nc' | 'nomip'>
{
    return {
        folder: true,
        name: 'fnt-with-pic',
        defaultOptions: {
            ...defaultOptions,
            resolutionOptions: {
                template: '@%%x',
                resolutions: { default: 1 },
                fixedResolution: 'default',
                ...defaultOptions.resolutionOptions,
            },
            font: {
                textureSize: [512, 512],
                ...defaultOptions.font,
            },
        },
        tags: {
            fnt: 'fnt',
            nc: 'nc',
            nomip: 'nomip',
        },
        test(asset: Asset)
        {
            return asset.allMetaData[this.tags!.fnt] && asset.isFolder;
        },
        async transform(asset: Asset, options)
        {
            const customOption = merge.clone(options);

            const fileName = stripTags(path.removeExt(asset.filename, path.extname(asset.filename)));

            const configAssets = findAssets((assetObj) =>
            {
                const name = stripTags(assetObj.filename);

                if (!checkExt(name, '.json')) return false;

                const a = stripTags(path.removeExt(assetObj.filename, path.extname(assetObj.filename)));

                return a === fileName // check filename
                    && asset.rootTransformAsset.directory === assetObj.rootTransformAsset.directory;
            }, asset.rootAsset as Asset, true);

            if (configAssets.length > 0)
            {
                const custom = JSON.parse(configAssets[0].buffer.toString());

                merge.recursive(customOption, custom);
            }

            // skip the children so that they do not get processed!
            asset.skipChildren();

            const { resolutionOptions } = customOption;

            const fixedResolutions: { [x: string]: number } = {};

            fixedResolutions[resolutionOptions.fixedResolution] = resolutionOptions.resolutions[
                resolutionOptions.fixedResolution];

            const largestResolution = Math.max(...Object.values(resolutionOptions.resolutions));
            const resolutionHash = asset.allMetaData[this.tags!.nomip] ? 1 : resolutionOptions.resolutions;

            const assets: Asset[] = [];

            const promises: Promise<void>[] = [];

            Object.values(resolutionHash)
                .sort((a, b) => b - a)
                .forEach((resolution) =>
                {
                    promises.push((async () =>
                    {
                        const scale = resolution / largestResolution;

                        const newFileName = generateScaledName(stripTags(asset.filename.replace(/\.(ttf)$/i, '')), resolution, resolutionOptions.template);

                        // set the family name to the filename if it doesn't exist
                        asset.metaData.family ??= stripTags(path.trimExt(asset.filename));
                        const {
                            font,
                            textures,
                        } = await GenerateFntByImages(asset.path, {

                            ...customOption.font,
                            filename: `${newFileName}`,
                            textureSize: [Math.round(customOption.font.textureSize[0] * scale), Math.round(customOption.font.textureSize[1] * scale)],
                            scale,
                        });

                        textures.forEach(({
                            filename,
                            texture,
                        }) =>
                        {
                            const newTextureName = `${filename}`;

                            const newTextureAsset = createNewAssetAt(asset, newTextureName);

                            // don't compress!
                            newTextureAsset.metaData[this.tags!.nc] = asset.rootTransformAsset.allMetaData[this.tags!.nc];
                            newTextureAsset.metaData[this.tags!.nomip] = true;
                            newTextureAsset.metaData.mIgnore = true;

                            assets.push(newTextureAsset);

                            newTextureAsset.buffer = texture;
                        });

                        const newFontAsset = createNewAssetAt(asset, `${newFileName}.fnt`);

                        newFontAsset.buffer = Buffer.from(font.data.replaceAll(/face=".*?"/igm, `face="${asset.metaData.family}"`));
                        newFontAsset.metaData[this.tags!.fnt] = true;
                        assets.push(newFontAsset);
                    })());
                });

            await Promise.all(promises);

            return assets;
        },
    };
}

/**
 * Generates a mipmap-style name
 * @param name Original name
 * @param scale Scale factor
 * @param template Naming template
 */
export function generateScaledName(
    name: string,
    scale: number,
    template: string,
): string
{
    const scaleLabel = scale !== 1 ? template.replace('%%', scale.toString()) : '';

    return `${name}${scaleLabel}`;
}

/**
 * Generates FNT font from image files
 * @param input Path to folder containing image files
 * @param params Parameters needed to generate the font
 */
async function GenerateFntByImages(input: string, params: fntOptionFont & { filename: string, scale: number }): Promise<{
    textures: { filename: string, texture: Buffer }[],
    font: { filename: string, data: string }
}>
{
    const globPath = `${input}/**/*.{jpg,png,gif}`;
    const files = await glob(globPath);

    const texturesToPack = await Promise.all(files.map(async (f) =>
    {
        const contents = await fs.readFile(f);

        return {
            path: stripTags(path.relative(input, f)),
            contents,
        };
    }));

    const ptOptions: PackTexturesOptions = {
        textureName: params.filename,
        texturesToPack,
        width: params.textureSize![0],
        height: params.textureSize![1],
        padding: params.texturePadding,
        powerOfTwo: params.pot,
        textureFormat: 'png',
        allowRotation: false,
        scale: params.scale,
        fixedSize: true,
        allowTrim: false,
        removeFileExtension: false,
    };

    return new Promise(async (resolve, reject) =>
    {
        if (files.length === 0)
        {
            reject();

            return;
        }

        const out = await packTextures(ptOptions);

        const firstFileName = path.basename(files[0]);
        // const firstCharStr = path.removeExt(firstFileName, extname(firstFileName));
        // const firstCharStr = '0';
        let fontSize: number = 0;

        out.jsons.forEach((n) =>
        {
            if (n.json.frames[firstFileName])
            {
                fontSize = n.json.frames[firstFileName].spriteSourceSize.h;
            }
        });

        const fntStr = convertTPS2FntStr({
            ...params,
            fontSize,
            texturesToPack,
            out,
        });

        const txtrArr: { filename: string; texture: Buffer; }[] = [];

        out.textures.forEach((n) =>
        {
            txtrArr.push({
                filename: n.name,
                texture: n.buffer,
            });
        });

        resolve({
            textures: txtrArr,
            font: {
                filename: `${params.filename}.fnt`,
                data: fntStr,
            },
        });
    });
}

/**
 * Converts TPS data to FNT
 * @param {Object} params - The parameters for converting TPS data
 */
function convertTPS2FntStr(
    params: fntOptionFont & {
        texturesToPack: { path: string, contents: Buffer }[],
        fontSize: number,
        out: {
            textures: { name: string, buffer: Buffer }[];
            jsons: { name: string, json: any }[];
        }
    }): string
{
    const pageArr: string[] = [];
    const charArr: string[] = [];

    let index = 0;

    params.out.jsons.forEach((n, i) =>
    {
        pageArr.push(`\t\t<page id="${i}" file="${n.json.meta.image}"/>`);
        Object.keys(n.json.frames)
            .forEach((charSrc) =>
            {
                const char = path.removeExt(charSrc, path.extname(charSrc));

                if (char.length > 1)
                {
                    BuildReporter.warn(`[AssetPack][webfont][fnt-with-pic] File name length greater than 1, skipping this file : ${charSrc}`);

                    return;
                }
                const item = n.json.frames[charSrc];

                charArr.push(`\t\t<char id="${char.charCodeAt(0)}" index="${index++}" `
                    + `letter="${char}" `
                    + `width="${item.frame.w}" height="${item.frame.h}" `
                    + `xoffset="0" yoffset="0" `
                    + `xadvance="${item.frame.w}" chnl="15" `
                    + `x="${item.frame.x}" y="${item.frame.y}" page="${i}"/>`);
            });
    });

    return `<?xml version="1.0"?>
<font>
    <info face="" size="${params.fontSize}" bold="0" italic="0" charset="" unicode="1" stretchH="100" smooth="1" aa="1" padding="${Array(4)
    .fill(params.texturePadding ?? 2)
    .join(',')}" spacing="0,0" outline="0"/>
    <common lineHeight="${params.fontSize}" base="${params.fontSize}" scaleW="${params.textureSize![0]}" scaleH="${params.textureSize![1]}" `
        + `pages="${params.out.textures.length}" packed="0" alphaChnl="0" redChnl="0" greenChnl="0" blueChnl="0"/>
    <pages>
${pageArr.join(`\n`)}
    </pages>\n`
        + `\t<chars count="${params.texturesToPack.length}">
${charArr.join(`\n`)}
    </chars>
</font>`;
}
