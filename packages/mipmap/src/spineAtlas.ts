import type { Plugin } from '@assetpack/core';
import { checkExt, hasTag } from '@assetpack/core';
import fs from 'fs-extra';
import type { MipmapOptions } from './mipmap';

export type SpineOptions = MipmapOptions<'spine'>;

type RequiredSpineOptions = Required<SpineOptions>;

export function spineAtlasMipmap(options?: Partial<SpineOptions>): Plugin<SpineOptions>
{
    const defaultOptions: SpineOptions = {
        template: '@%%x',
        resolutions: { default: 1, low: 0.5 },
        fixedResolution: 'default',
        ...options,
        tags: {
            fix: 'fix',
            spine: 'spine',
            ...options?.tags
        },
    };

    return {
        folder: false,
        test(tree, _p, opts)
        {
            const opt = { ...defaultOptions.tags, ...opts.tags } as Required<SpineOptions['tags']>;

            return hasTag(tree, 'file', opt.spine) && checkExt(tree.path, '.atlas');
        },
        async transform(tree, processor, options)
        {
            const tags = { ...defaultOptions.tags, ...options.tags } as Required<SpineOptions['tags']>;
            const transformOptions = { ...defaultOptions, ...options } as RequiredSpineOptions;

            const largestResolution = Math.max(...Object.values(transformOptions.resolutions));
            const resolutionHash = hasTag(tree, 'path', tags.fix)
                ? {
                    default: transformOptions.resolutions[
                        transformOptions.fixedResolution
                    ]
                }
                : transformOptions.resolutions;

            const rawAtlas = fs.readFileSync(tree.path, 'utf8');

            for (const resolution of Object.values(resolutionHash))
            {
                const scale = resolution / largestResolution;
                const template = transformOptions.template.replace('%%', resolution.toString());
                const outputName = processor.inputToOutput(tree.path).replace(/(\.[\w\d_-]+)$/i, `${template}$1`);

                const out = rescaleAtlas(rawAtlas, scale, template);

                processor.addToTreeAndSave({
                    tree,
                    outputOptions: {
                        outputPathOverride: outputName,
                        outputData: out
                    },
                    transformOptions: {
                        transformId: 'spine-atlas',
                        transformData: {
                            resolution: resolution.toString(),
                        },
                    }
                });
            }
        }
    };
}

/**
 * Re-scale atlas raw string data to given scale
 * @param raw - Raw atlas data as string
 * @param scale - The multiplier for position and size values
 * @param template - Resolution template, same used for images
 */
function rescaleAtlas(raw: string, scale = 1, template = ''): string
{
    const lines = raw.split(/\r\n|\r|\n/);

    // Regex for xy values, like 'size: 2019,463', 'orig: 134, 240'
    const reXY = /(.*?:\s?)(\d+)(\s?,\s?)(\d+)$/;

    // Regex for image names, like 'image.png', 'img.jpg'
    const reImg = /(.+)(.png|jpg|jpeg)$/;

    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const i in lines)
    {
        let line = lines[i];
        const matchXY = reXY.exec(line);

        if (matchXY)
        {
            // Multiply values by scale
            const x = Math.floor(Number(matchXY[2]) * scale);
            const y = Math.floor(Number(matchXY[4]) * scale);

            // Rewrite line with new values
            line = line.replace(reXY, `$1${x}$3${y}`);
        }

        if (reImg.exec(line))
        {
            // Rename images using provided template
            line = line.replace(reImg, `$1${template}$2`);
        }

        lines[i] = line;
    }

    return lines.join('\n');
}
