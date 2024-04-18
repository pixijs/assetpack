import type { Asset, PluginOptions } from '@play-co/assetpack-core';
import { checkExt, type AssetPipe, createNewAssetAt } from '@play-co/assetpack-core';
import type { MipmapOptions } from './mipmapCompress';

export type SpineOptions = PluginOptions<'fix' | 'nc'> & MipmapOptions;

export function spineAtlasMipmap(_options?: SpineOptions): AssetPipe<SpineOptions>
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
        test(asset: Asset, options)
        {
            return !asset.allMetaData[options.tags.fix as any] && checkExt(asset.path, '.atlas');
        },
        async transform(asset: Asset, options)
        {
            const fixedResolutions: {[x: string]: number} = {};

            fixedResolutions[options.fixedResolution] = options.resolutions[options.fixedResolution];

            const largestResolution = Math.max(...Object.values(options.resolutions));
            const resolutionHash = asset.allMetaData[options.tags.fix as any] ? fixedResolutions : options.resolutions;

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
