import type { PluginOptions, Asset, AssetPipe } from '@assetpack/core';
import { createNewAssetAt, stripTags, relative  } from '@assetpack/core';
import { readFile, writeFile, writeJson } from 'fs-extra';
import glob from 'glob-promise';
import type { PackTexturesOptions, TexturePackerFormat } from './packer/packTextures';
import { packTextures } from './packer/packTextures';

export interface TexturePackerOptions extends PluginOptions<'tps' | 'fix' | 'jpg' | 'nc' >
{
    texturePacker?: Partial<PackTexturesOptions>;
    resolutionOptions?: {
        /** A template for denoting the resolution of the images. */
        template?: string;
        /** An object containing the resolutions that the images will be resized to. */
        resolutions?: Record<string, number>;
        /** A resolution used if the fixed tag is applied. Resolution must match one found in resolutions. */
        fixedResolution?: string;
        /** The maximum size a sprite sheet can be before its split out */
        maximumTextureSize?: number;
    }
}

export function texturePacker(_options: TexturePackerOptions = {}): AssetPipe<TexturePackerOptions>
{
    const defaultOptions = {
        resolutionOptions: {
            template: '@%%x',
            resolutions: { default: 1, low: 0.5 },
            fixedResolution: 'default',
            maximumTextureSize: 4096,
            ..._options.resolutionOptions,
        },
        texturePacker: {
            padding: 2,
            nameStyle: 'relative',
            ..._options.texturePacker,
        },
        tags: {
            tps: 'tps',
            fix: 'fix',
            jpg: 'jpg',
            ..._options.tags,
        }
    } as TexturePackerOptions;

    return {
        folder: true,
        name: 'texture-packer-pixi',
        defaultOptions,
        test(asset: Asset, options)
        {
            return asset.isFolder && asset.metaData[options.tags.tps as any];
        },
        async transform(asset: Asset, options)
        {
            const { resolutionOptions, texturePacker, tags } = options;

            const fixedResolutions: {[x: string]: number} = {};

            // eslint-disable-next-line max-len
            fixedResolutions[resolutionOptions.fixedResolution as any] = resolutionOptions.resolutions[resolutionOptions.fixedResolution];

            asset.ignoreChildren = true;

            const largestResolution = Math.max(...Object.values(resolutionOptions.resolutions));
            const resolutionHash = asset.allMetaData[tags.fix as any] ? fixedResolutions : resolutionOptions.resolutions;

            const globPath = `${asset.path}/**/*.{jpg,png,gif}`;
            const files = await glob(globPath);

            if (files.length === 0)
            {
                return [];
            }

            const texturesToPack = await Promise.all(files.map(async (f) =>
            {
                const contents = await readFile(f);

                return { path: stripTags(relative(asset.path, f)), contents };
            }));

            const textureFormat = (asset.metaData[tags.jpg as any] ? 'jpg' : 'png') as TexturePackerFormat;

            const texturePackerOptions = {
                ...texturePacker,
                ...{
                    width: resolutionOptions?.maximumTextureSize,
                    height: resolutionOptions?.maximumTextureSize,
                },
                textureFormat,
            };

            const promises: Promise<void>[] = [];

            const assets: Asset[] = [];

            Object.values(resolutionHash).sort((a, b) => b - a).forEach((resolution) =>
            {
                const scale = resolution / largestResolution;

                promises.push((async () =>
                {
                    const textureName = texturePackerOptions.textureName ?? stripTags(asset.filename);

                    const out = await packTextures({
                        ...texturePackerOptions,
                        textureName,
                        texturesToPack,
                        scale,
                        resolution,
                    });

                    const outPromises: Promise<void>[] = [];

                    for (let i = 0; i < out.textures.length; i++)
                    {
                        const { buffer, name } = out.textures[i];

                        const textureAsset = createNewAssetAt(asset, name);

                        outPromises.push(writeFile(textureAsset.path, buffer));

                        const { json, name: jsonName } = out.jsons[i];

                        const jsonAsset = createNewAssetAt(asset, jsonName);

                        jsonAsset.metaData.page = i;

                        outPromises.push(writeJson(jsonAsset.path, json, { spaces: 2 }));

                        textureAsset.metaData[tags.fix] = true;
                        jsonAsset.metaData[tags.nc] = true;

                        assets.push(textureAsset, jsonAsset);
                    }

                    await Promise.all(outPromises);
                })());
            });

            await Promise.all(promises);

            return assets;
        },

    };
}
