import type { Plugin, PluginOptions } from '@assetpack/core';
import { checkExt, hasTag } from '@assetpack/core';
import type sharp from 'sharp';
import { sharpCompress } from './utils';

interface CompressPngOptions extends PluginOptions<'nc'>
{
    compression: Omit<sharp.PngOptions, 'force'>;
}

// converts png, jpg, jpeg
export function compressPng(options?: CompressPngOptions): Plugin<CompressPngOptions>
{
    const defaultOptions: Required<CompressPngOptions> = {
        compression: {
            quality: 80,
            ...options?.compression
        },
        tags: {
            nc: 'nc'
        }
    };

    return {
        folder: false,
        test(tree, _p, opts)
        {
            const tags = { ...defaultOptions.tags, ...opts.tags } as Required<CompressPngOptions['tags']>;

            return checkExt(tree.path, '.png') && !hasTag(tree, 'path', tags.nc);
        },
        async post(tree, processor, options)
        {
            const pngOpts = {
                ...defaultOptions.compression,
                ...options?.compression
            };
            const input = tree.path;

            try
            {
                await sharpCompress('png', { input, processor, tree, compression: pngOpts });
            }
            catch (error)
            {
                throw new Error(`[compressPng] Failed to compress png: ${input} - ${(error as Error).message}`);
            }
        }
    };
}
