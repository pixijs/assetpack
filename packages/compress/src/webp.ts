import type { Plugin, PluginOptions } from '@assetpack/core';
import { checkExt, hasTag } from '@assetpack/core';
import type sharp from 'sharp';
import { sharpCompress } from './utils';

interface CompressWebpOptions extends PluginOptions<'nc'>
{
    compression: Omit<sharp.WebpOptions, 'force'>;
}

// converts png, jpg, jpeg
export function compressWebp(options?: CompressWebpOptions): Plugin<CompressWebpOptions>
{
    const defaultOptions: Required<CompressWebpOptions> = {
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
            const tags = { ...defaultOptions.tags, ...opts.tags } as Required<CompressWebpOptions['tags']>;

            return checkExt(tree.path, '.png', '.jpg', '.jpeg') && !hasTag(tree, 'path', tags.nc);
        },
        async post(tree, processor, options)
        {
            const webpOpts = {
                ...defaultOptions.compression,
                ...options?.compression
            };
            const input = tree.path;
            const output = tree.path.replace(/\.(png|jpg|jpeg)$/i, '.webp');

            try
            {
                await sharpCompress('webp', { input, processor, tree, compression: webpOpts, output });
            }
            catch (error)
            {
                throw new Error(`[compressWebp] Failed to compress file to webp: ${input} - ${(error as Error).message}`);
            }
        }
    };
}
