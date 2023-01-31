import type { Plugin, PluginOptions, Processor, TransformData } from '@assetpack/core';
import { hasTag, path, SavableAssetCache } from '@assetpack/core';
import type {
    MaxRectsPackerMethod,
    PackerExporterType,
    PackerType,
    TextureFormat,
    TexturePackerOptions as TPOptions
} from 'free-tex-packer-core';
import { packAsync } from 'free-tex-packer-core';
import { readFileSync } from 'fs';
import fs from 'fs-extra';
import glob from 'glob-promise';
import type { TPTransformData } from './manifestParser';

// deep required type
type DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends (infer U)[] ? DeepRequired<U>[] : DeepRequired<T[P]>;
};

export interface TexturePackerOptions extends PluginOptions<'tps' | 'fix' | 'jpg'>
{
    texturePacker: TPOptions;
    resolutionOptions: {
        /** A template for denoting the resolution of the images. */
        template?: string;
        /** An object containing the resolutions that the images will be resized to. */
        resolutions?: {[x: string]: number};
        /** A resolution used if the fixed tag is applied. Resolution must match one found in resolutions. */
        fixedResolution?: string;
        /** The maximum size a sprite sheet can be before its split out */
        maximumTextureSize?: number;
    }
}

type ReqTexturePackerOptions = DeepRequired<TexturePackerOptions>;

export function texturePacker(options?: Partial<TexturePackerOptions>): Plugin<TexturePackerOptions>
{
    const defaultOptions: TexturePackerOptions = {
        tags: {
            tps: 'tps',
            fix: 'fix',
            jpg: 'jpg',
            ...options?.tags,
        },
        resolutionOptions: {
            template: '@%%x',
            resolutions: { default: 1, low: 0.5 },
            fixedResolution: 'default',
            maximumTextureSize: 4096,
            ...options?.resolutionOptions,
        },
        texturePacker: {
            padding: 2,
            packer: 'MaxRectsPacker' as PackerType,
            packerMethod: 'Smart' as MaxRectsPackerMethod,
            ...options?.texturePacker,
        }
    };

    return {
        folder: true,
        name: 'texture-packer',
        test(tree, _p, opts)
        {
            const opt = { ...defaultOptions.tags, ...opts.tags } as DeepRequired<TexturePackerOptions['tags']>;

            return hasTag(tree, 'file', opt.tps);
        },
        async transform(tree, processor, optionOverrides)
        {
            const tags = { ...defaultOptions.tags, ...optionOverrides.tags } as DeepRequired<TexturePackerOptions['tags']>;
            const resolutionOptions = { ...defaultOptions.resolutionOptions, ...optionOverrides.resolutionOptions };
            const transformOptions = {
                tags,
                resolutionOptions,
                texturePacker: {
                    textureName: path.basename(processor.inputToOutput(tree.path)),
                    textureFormat: (hasTag(tree, 'file', tags.jpg) ? 'jpg' : 'png') as TextureFormat,
                    ...defaultOptions.texturePacker,
                    ...{
                        width: resolutionOptions?.maximumTextureSize,
                        height: resolutionOptions?.maximumTextureSize,
                    },
                    ...optionOverrides.texturePacker
                },
            } as ReqTexturePackerOptions;

            const largestResolution = Math.max(...Object.values(transformOptions.resolutionOptions.resolutions));
            const resolutionHash = hasTag(tree, 'path', transformOptions.tags.fix)
                ? {
                    default: transformOptions.resolutionOptions.resolutions[
                        transformOptions.resolutionOptions.fixedResolution
                    ]
                }
                : transformOptions.resolutionOptions.resolutions;

            const globPath = `${tree.path}/**/*.{jpg,png,gif}`;
            const files = await glob(globPath);

            const imagesToPack = files.map((f) => ({ path: f, contents: readFileSync(f) }));

            if (imagesToPack.length === 0)
            {
                return;
            }

            const cacheData: TransformData['files'] = [];
            const hash: Record<string, boolean> = {};
            const front = transformOptions.resolutionOptions.template.split('%%')[0];
            // loop through each resolution and pack the images

            for (const resolution of Object.values(resolutionHash))
            {
                const scale = resolution / largestResolution;
                const origScale = largestResolution;
                const template = transformOptions.resolutionOptions.template.replace('%%', resolution.toString());

                const res = await packAsync(imagesToPack, { ...transformOptions.texturePacker, scale });
                const out = await processTPSFiles(res, {
                    inputDir: tree.path,
                    outputDir: processor.inputToOutput(tree.path),
                    template,
                    scale,
                    originalScale: origScale,
                    processor,
                });

                out.forEach((o) =>
                {
                    const oo = o.split(front)[0];

                    if (o.endsWith('.json') && !hash[oo])
                    {
                        hash[oo] = true;
                        cacheData.push({
                            path: `${oo}.json`,
                            transformedPaths: [],
                        });
                    }

                    processor.addToTree({
                        tree,
                        outputOptions: {
                            outputPathOverride: o,
                        },
                        transformId: 'tps',
                        transformData: {
                            prefix: template,
                        }
                    }
                    );
                });
            }

            SavableAssetCache.set(tree.path, {
                tree,
                transformData: {
                    type: this.name!,
                    prefix: transformOptions.resolutionOptions.template,
                    resolutions: Object.values(transformOptions.resolutionOptions.resolutions),
                    files: cacheData
                } as TPTransformData
            });
        },
    };
}

export function pixiTexturePacker(options?: Partial<TexturePackerOptions>): Plugin<TexturePackerOptions>
{
    return texturePacker({
        ...options,
        texturePacker: {
            ...options?.texturePacker,
            exporter: 'Pixi' as PackerExporterType,
        },
    });
}
type ReturnedPromiseResolvedType<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;

interface ProcessOptions
{
    inputDir: string;
    outputDir: string;
    template: string;
    scale: number;
    originalScale: number;
    processor: Processor;
}
async function processTPSFiles(files: ReturnedPromiseResolvedType<typeof packAsync>, options: ProcessOptions)
{
    const outputFilePaths = [];

    for (const item of files)
    {
        // create a name that injects a template eg _mip
        const templateName = item.name.replace(/(\.[\w\d_-]+)$/i, `${options.template}$1`);
        const outputDir = options.outputDir;

        // make sure the folder we save to exists
        fs.ensureDirSync(outputDir);

        // this is where we save the files
        const outputFile = path.joinSafe(outputDir, templateName);

        // so one thing FREE texture packer does different is that it either puts the full paths in
        // or the image name.
        // we rely on the folder names being preserved in the frame data.
        // we need to modify the frame names before we save so they are the same
        // eg raw-assets/image/icons{tps}/cool/image.png -> cool/image.png
        if (outputFile.split('.').pop() === 'json')
        {
            const json = JSON.parse(item.buffer.toString('utf8'));

            const newFrames: {[x: string]: any} = {};

            for (const i in json.frames)
            {
                const normalizedDir = options.inputDir.replace(/\\/g, '/');
                const frameName = i.replace(`${normalizedDir}/`, '');

                newFrames[frameName] = json.frames[i];
            }

            json.frames = newFrames;
            json.meta.image = json.meta.image.replace(/(\.[\w\d_-]+)$/i, `${options.template}$1`);
            json.meta.scale *= options.originalScale;

            options.processor.saveToOutput({
                tree: undefined as any,
                outputOptions: {
                    outputPathOverride: outputFile,
                    outputData: JSON.stringify(json),
                }
            });
        }
        else
        {
            options.processor.saveToOutput({
                tree: undefined as any,
                outputOptions: {
                    outputPathOverride: outputFile,
                    outputData: item.buffer,
                }
            });
        }

        outputFilePaths.push(outputFile);
    }

    return outputFilePaths;
}
