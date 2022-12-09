import type { Plugin, PluginOptions, Processor } from '@assetpack/core';
import { hasTag, path } from '@assetpack/core';
import type {
    MaxRectsPackerMethod,
    PackerExporterType,
    PackerType,
    TextureFormat,
    TexturePackerOptions as TPOptions,
} from 'free-tex-packer-core';
import { packAsync } from 'free-tex-packer-core';
import { readFileSync } from 'fs';
import { ensureDirSync, writeFileSync } from 'fs-extra';
import glob from 'glob-promise';
import sharp from 'sharp';

// deep required type
type DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends (infer U)[] ? DeepRequired<U>[] : DeepRequired<T[P]>;
};

export interface TexturePackerOptions extends PluginOptions<'tps' | 'no-mip' | 'jpg'>
{
    texturePacker: TPOptions;
    resolutionOptions: {
        /** A prefix template for denoting the resolution of the images. */
        prefixTemplate?: string;
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
            'no-mip': 'no-mip',
            jpg: 'jpg',
            ...options?.tags,
        },
        resolutionOptions: {
            prefixTemplate: '@%%x',
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
            const resolutionHash = hasTag(tree, 'path', transformOptions.tags['no-mip'])
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

            // loop through each resolution and pack the images
            for (const resolution of Object.values(resolutionHash))
            {
                const scale = resolution / largestResolution;
                const origScale = largestResolution;
                const prefix = transformOptions.resolutionOptions.prefixTemplate.replace('%%', resolution.toString());

                const res = await packAsync(imagesToPack, transformOptions.texturePacker);
                const out = await processTPSFiles(res, {
                    inputDir: tree.path,
                    outputDir: processor.inputToOutput(tree.path),
                    prefix,
                    scale,
                    originalScale: origScale,
                    processor,
                });

                out.forEach((o) => processor.addToTree({
                    tree,
                    outputOptions: {
                        outputPathOverride: o,
                    },
                    transformId: 'tps',
                }));
            }
        }
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
    prefix: string;
    scale: number;
    originalScale: number;
    processor: Processor;
}
async function processTPSFiles(files: ReturnedPromiseResolvedType<typeof packAsync>, options: ProcessOptions)
{
    const outputFilePaths = [];

    for (const item of files)
    {
        // create a name that injects a prefix eg _mip
        const prefixName = item.name.replace(/(\.[\w\d_-]+)$/i, `${options.prefix}$1`);
        const outputDir = options.outputDir;

        // make sure the folder we save to exists
        ensureDirSync(outputDir);

        // this is where we save the files
        const outputFile = path.join(outputDir, prefixName);

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

            if (options.scale !== 1)
            {
                // FREE texture packer does not actually scale images..
                // so first we scale the data in the json...
                const scale = options.scale;
                // resize

                for (const i in json.frames)
                {
                    const frameData = json.frames[i];

                    delete frameData.pivot;

                    const frame = frameData.frame;

                    frame.x = Math.ceil(frame.x * scale);
                    frame.y = Math.ceil(frame.y * scale);
                    frame.w = Math.ceil(frame.w * scale);
                    frame.h = Math.ceil(frame.h * scale);

                    const spriteSourceSize = frameData.spriteSourceSize;

                    spriteSourceSize.x = Math.ceil(spriteSourceSize.x * scale);
                    spriteSourceSize.y = Math.ceil(spriteSourceSize.y * scale);
                    spriteSourceSize.w = Math.ceil(spriteSourceSize.w * scale);
                    spriteSourceSize.h = Math.ceil(spriteSourceSize.h * scale);

                    const sourceSize = frameData.sourceSize;

                    sourceSize.w = Math.ceil(sourceSize.w * scale);
                    sourceSize.h = Math.ceil(sourceSize.h * scale);
                }

                const jsonSize = json.meta.size;

                jsonSize.w = Math.ceil(jsonSize.w * scale);
                jsonSize.h = Math.ceil(jsonSize.h * scale);
            }

            json.meta.image = json.meta.image.replace(/(\.[\w\d_-]+)$/i, `${options.prefix}$1`);

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

            // and then we resize the image if we need to
            if (options.scale !== 1)
            {
                // now mip the file..
                const meta = await sharp(outputFile).metadata();

                if (!meta.width || !meta.height)
                {
                    throw new Error(`[texture-packer] Could not get metadata for ${outputFile}`);
                }

                const res = await sharp(outputFile)
                    .resize({ width: meta.width * options.scale, height: meta.height * options.scale })
                    .toBuffer()
                    .catch((e) =>
                    {
                        throw new Error(`[texture-packer] Could not resize ${outputFile}: ${e.message}`);
                    });

                writeFileSync(outputFile, res);
            }
        }

        outputFilePaths.push(outputFile);
    }

    return outputFilePaths;
}
