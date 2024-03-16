import type { Asset } from '@assetpack/core';
import { checkExt, type AssetPipe, type PluginOptions, createNewAssetAt } from '@assetpack/core';
import { writeFile } from 'fs-extra';

// import { checkExt, hasTag, SavableAssetCache } from '@assetpack/core';
import type { Sharp } from 'sharp';
import sharp from 'sharp';

export interface MipmapOptions extends PluginOptions<'fix'>
{
    /** A template for denoting the resolution of the images. */
    template?: string;
    /** An object containing the resolutions that the images will be resized to. */
    resolutions?: {[x: string]: number};
    /** A resolution used if the fixed tag is applied. Resolution must match one found in resolutions. */
    fixedResolution?: string;
}

export function mipmap(_options: Partial<MipmapOptions> = {}): AssetPipe<MipmapOptions>
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
            return !asset.allMetaData[options.tags.fix] && checkExt(asset.path, '.png', '.jpg', ',jpeg');
        },
        async transform(asset: Asset, options)
        {
            const fixedResolutions: {[x: string]: number} = {};

            fixedResolutions[options.fixedResolution] = options.resolutions[options.fixedResolution];

            const largestResolution = Math.max(...Object.values(options.resolutions));
            const resolutionHash = asset.allMetaData[options.tags.fix] ? fixedResolutions : options.resolutions;

            let sharpAsset: Sharp;
            let meta: {width: number, height: number};

            try
            {
                sharpAsset = sharp(asset.path);
                meta = await sharpAsset.metadata() as {width: number, height: number};
            }
            catch (e: any)
            {
                throw new Error(`[mipmap] Could not get metadata for ${asset.path}: ${e.message}`);
            }

            if (!meta.width || !meta.height)
            {
                throw new Error(`[mipmap] Could not get metadata for ${asset.path}`);
            }

            const promises: Promise<void>[] = [];

            // loop through each resolution and pack the images
            const assets = Object.values(resolutionHash).map((resolution) =>
            {
                const scale = resolution / largestResolution;
                const template = options.template.replace('%%', resolution.toString());
                const outputName = asset.filename.replace(/(\.[\w\d_-]+)$/i, `${template}$1`);

                const scaleAsset = createNewAssetAt(asset, outputName);

                const promise = sharpAsset
                    .resize({
                        width: Math.ceil(meta.width * scale),
                        height: Math.ceil(meta.height * scale)
                    })
                    .toBuffer()
                    .then((data) => writeFile(scaleAsset.path, data));

                promises.push(promise); //

                return scaleAsset;
            });

            await Promise.all(promises);

            return assets;
        }
    };
}
