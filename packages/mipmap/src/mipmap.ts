import type { Plugin, PluginOptions, Processor } from '@assetpack/core';
import { checkExt, hasTag, SavableAssetCache } from '@assetpack/core';
import sharp from 'sharp';

export interface MipmapOptions<T extends string = ''> extends PluginOptions<'fix' | T>
{
    /** A template for denoting the resolution of the images. */
    template?: string;
    /** An object containing the resolutions that the images will be resized to. */
    resolutions?: {[x: string]: number};
    /** A resolution used if the fixed tag is applied. Resolution must match one found in resolutions. */
    fixedResolution?: string;
}

type RequiredMipmapOptions = Required<MipmapOptions>;

export function mipmap(options?: Partial<MipmapOptions>): Plugin<MipmapOptions>
{
    const defaultOptions: MipmapOptions = {
        template: '@%%x',
        resolutions: { default: 1, low: 0.5 },
        fixedResolution: 'default',
        ...options,
        tags: {
            fix: 'fix',
            ...options?.tags
        },
    };

    return {
        folder: false,
        name: 'mipmap',
        test(tree)
        {
            return checkExt(tree.path, '.png', '.jpg', ',jpeg');
        },
        async transform(tree, processor, options)
        {
            const tags = { ...defaultOptions.tags, ...options.tags } as Required<RequiredMipmapOptions['tags']>;
            const transformOptions = { ...defaultOptions, ...options } as RequiredMipmapOptions;

            const largestResolution = Math.max(...Object.values(transformOptions.resolutions));
            const resolutionHash = hasTag(tree, 'path', tags.fix)
                ? {
                    default: transformOptions.resolutions[
                        transformOptions.fixedResolution
                    ]
                }
                : transformOptions.resolutions;

            // loop through each resolution and pack the images
            for (const resolution of Object.values(resolutionHash))
            {
                const scale = resolution / largestResolution;
                const template = transformOptions.template.replace('%%', resolution.toString());
                let outputName = processor.inputToOutput(tree.path);

                // replace the extension with the template
                outputName = outputName.replace(/(\.[\w\d_-]+)$/i, `${template}$1`);

                const out = await processFile({
                    output: outputName,
                    input: tree.path,
                    scale,
                    processor,
                });

                processor.addToTreeAndSave({
                    tree,
                    outputOptions: {
                        outputPathOverride: outputName,
                        outputData: out
                    },
                    transformOptions: {
                        transformId: 'mipmap',
                        transformData: {
                            resolution: resolution.toString(),
                        },
                    }
                });
            }

            SavableAssetCache.set(tree.path, {
                tree,
                transformData: {
                    type: this.name!,
                    prefix: transformOptions.template,
                    resolutions: Object.values(resolutionHash),
                    files: [{
                        path: processor.inputToOutput(tree.path),
                        transformedPaths: []
                    }]
                }
            });
        }
    };
}

interface ProcessOptions
{
    output: string;
    input: string;
    scale: number;
    processor: Processor;
}

async function processFile(options: ProcessOptions)
{
    // now mip the file..
    const meta = await sharp(options.input).metadata().catch((e) =>
    {
        throw new Error(`[mipmap] Could not get metadata for ${options.input}: ${e.message}`);
    });

    if (!meta.width || !meta.height)
    {
        throw new Error(`[mipmap] Could not get metadata for ${options.input}`);
    }

    let res;

    try
    {
        res = await sharp(options.input)
            .resize({
                width: Math.ceil(meta.width * options.scale),
                height: Math.ceil(meta.height * options.scale)
            })
            .toBuffer();
    }
    catch (error)
    {
        throw new Error(`[mipmap] Could not resize ${options.input}: ${(error as Error).message}`);
    }

    return res;
}
