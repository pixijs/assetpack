import { checkExt, createNewAssetAt } from '../core/index.js';

import type { Asset, AssetPipe, PluginOptions } from '../core/index.js';
import type { MipmapOptions } from '../image/index.js';

export type SpineOptions = PluginOptions & MipmapOptions;

export type SpineAtlasMipmapTags = 'fix' | 'nomip';

export function spineAtlasMipmap(_options?: SpineOptions): AssetPipe<SpineOptions, SpineAtlasMipmapTags>
{
    return {
        folder: false,
        name: 'mipmap-spine-atlas',
        defaultOptions: {
            template: '@%%x',
            resolutions: { default: 1, low: 0.5 },
            fixedResolution: 'default',
            ..._options,
        },
        tags: {
            fix: 'fix',
            nomip: 'nomip',
        },
        test(asset: Asset)
        {
            return !asset.allMetaData[this.tags!.nomip] && checkExt(asset.path, '.atlas');
        },
        async transform(asset: Asset, options)
        {
            const fixedResolutions: {[x: string]: number} = {};

            fixedResolutions[options.fixedResolution] = options.resolutions[options.fixedResolution];

            const largestResolution = Math.max(...Object.values(options.resolutions));
            const resolutionHash = asset.allMetaData[this.tags!.fix] ? fixedResolutions : options.resolutions;

            const rawAtlas = asset.buffer.toString();

            // loop through each resolution and pack the images
            const assets = Object.values(resolutionHash).map((resolution) =>
            {
                const scale = resolution / largestResolution;
                let resolutionLabel = options.template.replace('%%', resolution.toString());

                resolutionLabel = resolution === 1 ? '' : resolutionLabel;

                const outputName = asset.filename.replace(/(\.[\w\d_-]+)$/i, `${resolutionLabel}$1`);

                const scaleAsset = createNewAssetAt(asset, outputName);

                const scaledAtlasData = rescaleAtlas(rawAtlas, scale, resolutionLabel);

                scaleAsset.buffer = Buffer.from(scaledAtlasData);

                return scaleAsset;
            });

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

    // Regex for scale values, like 'scale: 0.75'
    const regScale = /(scale:\s?)(\d+(\.\d+)?)$/;

    // Regex for rect values, like 'bounds:2,270,804,737', 'offsets:0,0,110,113'
    const regRect = /(.*?:\s?)(\d+)(\s?,\s?)(\d+)(\s?,\s?)(\d+)(\s?,\s?)(\d+)$/;

    // Regex for image names, like 'image.png', 'img.jpg'
    const reImg = /(.+)(.png|jpg|jpeg)$/;

    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const i in lines)
    {
        let line = lines[i];
        const matchXY = reXY.exec(line);
        const matchScale = regScale.exec(line);
        const matchRect = regRect.exec(line);

        if (matchXY)
        {
            // Multiply values by scale
            const x = Math.floor(Number(matchXY[2]) * scale);
            const y = Math.floor(Number(matchXY[4]) * scale);

            // Rewrite line with new values
            line = line.replace(reXY, `$1${x}$3${y}`);
        }
        else if (matchScale)
        {
            const newScale = Number(matchScale[2]) * scale;

            line = line.replace(regScale, `$1${newScale}`);
        }
        else if (matchRect)
        {
            const x1 = Math.floor(Number(matchRect[2]) * scale);
            const y1 = Math.floor(Number(matchRect[4]) * scale);
            const x2 = Math.floor(Number(matchRect[6]) * scale);
            const y2 = Math.floor(Number(matchRect[8]) * scale);

            line = line.replace(regRect, `$1${x1}$3${y1}$5${x2}$7${y2}`);
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
