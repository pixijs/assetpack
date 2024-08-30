import fs from 'fs-extra';
import { glob } from 'glob';
import { createNewAssetAt, Logger, path, stripTags } from '../core/index.js';
import { packTextures } from './packer/packTextures.js';

import type { Asset, AssetPipe, PluginOptions } from '../core/index.js';
import type { PackTexturesOptions, TexturePackerFormat } from './packer/packTextures.js';

export interface TexturePackerOptions extends PluginOptions
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
    /** If true, the frame names for the sprite sheet will be added to the asset meta data. */
    addFrameNames?: boolean;
}

function checkForTexturePackerShortcutClashes(
    frames: Record<string, unknown>,
    shortcutClash: Record<string, boolean>
)
{
    const clashes: string[] = [];

    for (const i in frames)
    {
        if (!shortcutClash[i])
        {
            shortcutClash[i] = true;
        }
        else
        {
            clashes.push(i);
        }
    }

    if (clashes.length > 0)
    {
        // eslint-disable-next-line max-len
        Logger.warn(`[AssetPack][texturePacker] Texture Packer Shortcut clash detected for between ${clashes.join(', ')}. This means that 'nameStyle' is set to 'short' and different sprite sheets have frames that share the same name. Please either rename the files or set 'nameStyle' in the texture packer options to 'relative'`);
    }
}

export function texturePacker(_options: TexturePackerOptions = {}): AssetPipe<TexturePackerOptions, 'tps' | 'fix' | 'jpg'>
{
    let shortcutClash: Record<string, boolean> = {};

    return {
        folder: true,
        name: 'texture-packer',
        defaultOptions: {
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
            addFrameNames: false,
        },
        tags: {
            tps: 'tps',
            fix: 'fix',
            jpg: 'jpg',
        },
        test(asset: Asset)
        {
            return asset.isFolder && asset.metaData[this.tags!.tps];
        },

        async start()
        {
            // restart the clashes!
            shortcutClash = {};
        },

        async transform(asset: Asset, options)
        {
            const { resolutionOptions, texturePacker } = options;

            const fixedResolutions: {[x: string]: number} = {};

            // eslint-disable-next-line max-len
            fixedResolutions[resolutionOptions.fixedResolution] = resolutionOptions.resolutions[resolutionOptions.fixedResolution];

            // skip the children so that they do not get processed!
            asset.skipChildren();

            const largestResolution = Math.max(...Object.values(resolutionOptions.resolutions));
            const resolutionHash = asset.allMetaData[this.tags!.fix] ? fixedResolutions : resolutionOptions.resolutions;

            const globPath = `${asset.path}/**/*.{jpg,png,gif}`;
            const files = await glob(globPath);

            if (files.length === 0)
            {
                return [];
            }

            const texturesToPack = await Promise.all(files.map(async (f) =>
            {
                const contents = await fs.readFile(f);

                return { path: stripTags(path.relative(asset.path, f)), contents };
            }));

            const textureFormat = (asset.metaData[this.tags!.jpg] ? 'jpg' : 'png') as TexturePackerFormat;

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

            let checkedForClashes = false;
            const imageNames: string[] = [];

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

                        textureAsset.buffer = buffer;
                        textureAsset.metaData.mIgnore = true;

                        const { json, name: jsonName } = out.jsons[i];

                        imageNames.push(...Object.keys(json.frames));

                        const jsonAsset = createNewAssetAt(asset, jsonName);

                        if (!checkedForClashes)
                        {
                            checkedForClashes = true;
                            // check for shortcut clashes..
                            checkForTexturePackerShortcutClashes(json.frames, shortcutClash);
                        }

                        jsonAsset.buffer = Buffer.from(JSON.stringify(json, null, 2));

                        textureAsset.metaData[this.tags!.fix] = true;

                        jsonAsset.transformData.page = i;

                        assets.push(textureAsset, jsonAsset);
                    }

                    await Promise.all(outPromises);
                })());
            });

            await Promise.all(promises);

            if (options.addFrameNames)
            {
                asset.metaData.frameNames = imageNames;
            }

            return assets;
        },

    };
}
