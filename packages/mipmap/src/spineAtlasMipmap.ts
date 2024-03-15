import type { Asset } from '@assetpack/core';
import { checkExt, type AssetPipe, createNewAssetAt } from '@assetpack/core';
import { readFile, writeFile } from 'fs-extra';

import type { MipmapOptions } from './mipmap';

export type SpineOptions = MipmapOptions;

export function spineAtlasMipmap(_options?: Partial<MipmapOptions>): AssetPipe
{
    const defaultOptions = {
        template: '@%%x',
        resolutions: { default: 1, low: 0.5 },
        fixedResolution: 'default',
        ..._options,
        tags: {
            fix: 'fix',
            ..._options?.tags
        },
    };

    return {
        folder: false,
        name: 'mipmap',
        defaultOptions,
        test(asset: Asset, options: Required<SpineOptions>)
        {
            return !asset.allMetaData[options.tags.fix] && checkExt(asset.path, '.atlas');
        },
        async transform(asset: Asset, options: Required<SpineOptions>)
        {
            const fixedResolutions: {[x: string]: number} = {};

            fixedResolutions[options.fixedResolution] = options.resolutions[options.fixedResolution];

            const largestResolution = Math.max(...Object.values(options.resolutions));
            const resolutionHash = asset.allMetaData[options.tags.fix] ? fixedResolutions : options.resolutions;

            const rawAtlas = await readFile(asset.path, { encoding: 'utf8' });

            const promises: Promise<void>[] = [];

            // loop through each resolution and pack the images
            const assets = Object.values(resolutionHash).map((resolution) =>
            {
                const scale = resolution / largestResolution;
                const template = options.template.replace('%%', resolution.toString());
                const outputName = asset.filename.replace(/(\.[\w\d_-]+)$/i, `${template}$1`);

                const scaleAsset = createNewAssetAt(asset, outputName);

                const scaledAtlasData = rescaleAtlas(rawAtlas, scale, template);

                const promise = writeFile(scaleAsset.path, scaledAtlasData);

                promises.push(promise);

                return scaleAsset;
            });

            await Promise.all(promises);

            return assets;
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
