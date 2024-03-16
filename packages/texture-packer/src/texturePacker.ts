import type { PluginOptions, Asset, AssetPipe } from '@assetpack/core';
import { createNewAssetAt, stripTags, relative, extname, basename  } from '@assetpack/core';
import type {
    MaxRectsPackerMethod,
    PackerExporterType,
    PackerType,
    TextureFormat,
    TexturePackerOptions as TPOptions
} from 'free-tex-packer-core';
import { packAsync } from 'free-tex-packer-core';
import { readFile, writeFile, writeJson } from 'fs-extra';
import glob from 'glob-promise';

export interface TexturePackerOptions extends PluginOptions<'tps' | 'fix' | 'jpg' | 'nc' >
{
    texturePacker?: TPOptions;
    shortNames?: boolean;
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
        shortNames: false,
        resolutionOptions: {
            template: '@%%x',
            resolutions: { default: 1, low: 0.5 },
            fixedResolution: 'default',
            maximumTextureSize: 4096,
            ..._options.resolutionOptions,

        },
        texturePacker: {
            padding: 2,
            packer: 'MaxRectsPacker' as PackerType,
            packerMethod: 'Smart' as MaxRectsPackerMethod,
            ..._options.texturePacker,
        },
        tags: {
            tps: 'tps',
            fix: 'fix',
            jpg: 'jpg',
            ..._options.tags,
        }
    };

    return {
        folder: true,
        name: 'texture-packer',
        defaultOptions,
        test(asset: Asset, options)
        {
            return asset.isFolder && asset.metaData[options.tags.tps];
        },
        async transform(asset: Asset, options)
        {
            const { resolutionOptions, texturePacker, tags } = options;

            const fixedResolutions: {[x: string]: number} = {};

            // eslint-disable-next-line max-len
            fixedResolutions[resolutionOptions.fixedResolution] = resolutionOptions.resolutions[resolutionOptions.fixedResolution];

            asset.ignoreChildren = true;

            const largestResolution = Math.max(...Object.values(resolutionOptions.resolutions));
            const resolutionHash = asset.allMetaData[tags.fix] ? fixedResolutions : resolutionOptions.resolutions;

            const globPath = `${asset.path}/**/*.{jpg,png,gif}`;
            const files = await glob(globPath);

            if (files.length === 0)
            {
                return [];
            }

            const imagesToPack = await Promise.all(files.map(async (f) =>
            {
                const contents = await readFile(f);

                return { path: f, contents };
            }));

            const textureFormat = (asset.metaData[tags.jpg] ? 'jpg' : 'png')as TextureFormat;

            const texturePackerOptions = {
                textureFormat,
                ...texturePacker as Partial<TexturePackerOptions>,
                ...{
                    width: resolutionOptions?.maximumTextureSize,
                    height: resolutionOptions?.maximumTextureSize,
                },
            };

            const promises: Promise<void>[] = [];

            const assets: Asset[] = [];

            Object.values(resolutionHash).forEach((resolution) =>
            {
                const scale = resolution / largestResolution;

                promises.push((async () =>
                {
                    const template = resolutionOptions.template.replace('%%', resolution.toString());
                    const textureName = stripTags(asset.filename);

                    const out = await packAsync(imagesToPack, {
                        ...texturePackerOptions,
                        textureName,
                        scale
                    });

                    const outPromises: Promise<void>[] = [];

                    for (let i = 0; i < out.length; i++)
                    {
                        const output = out[i];
                        const outputAssetName = output.name.replace(/(\.[\w\d_-]+)$/i, `${template}$1`);
                        const outputAsset = createNewAssetAt(asset, outputAssetName);

                        if (extname(output.name) === '.json')
                        {
                            const json = JSON.parse(out[0].buffer.toString('utf8'));

                            // replace extension with 'jpg'
                            const imagePath = outputAsset.filename.replace(/(\.[\w\d_-]+)$/i, `.${textureFormat}`);

                            const match = output.name.match(/-(.*?)\.json/);

                            // eslint-disable-next-line no-nested-ternary
                            outputAsset.metaData.page = out.length > 2 ? (match ? match[1] : 0) : 0;

                            processJsonFile(json, asset.path, imagePath, largestResolution, options.shortNames);

                            outPromises.push(writeJson(outputAsset.path, json, { spaces: 2 }));// );

                            outputAsset.metaData[tags.nc] = true;
                        }
                        else
                        {
                            // this will make sure the resizer ignore this asset as we already resized them here!
                            outputAsset.metaData[tags.fix] = true;

                            outPromises.push(writeFile(outputAsset.path, output.buffer));
                        }

                        await Promise.all(outPromises);

                        assets.push(outputAsset);
                    }
                })());
            });

            await Promise.all(promises);

            return assets;
        },

    };
}

export function pixiTexturePacker(options?: TexturePackerOptions): AssetPipe
{
    return texturePacker({
        ...options,
        texturePacker: {
            ...options?.texturePacker,
            exporter: 'Pixi' as PackerExporterType,
        },
    });
}

function processJsonFile(json: any, basePath: string, imagePath: string, originalScale: number, shortNames: boolean): void
{
    const newFrames: {[x: string]: any} = {};

    // so one thing FREE texture packer does different is that it either puts the full paths in
    // or the image name.
    // we rely on the folder names being preserved in the frame data.
    // we need to modify the frame names before we save so they are the same
    // eg raw-assets/image/icons{tps}/cool/image.png -> cool/image.png

    for (const i in json.frames)
    {
        const frameName = shortNames ? basename(i) : relative(basePath, i);

        newFrames[frameName] = json.frames[i];
    }

    json.frames = newFrames;
    json.meta.scale *= originalScale;
    json.meta.image = imagePath;
}
