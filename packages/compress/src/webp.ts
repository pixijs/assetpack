import type { Plugin, PluginOptions } from '@assetpack/core';
import { hasTag } from '@assetpack/core';
import type sharp from 'sharp';
import { compression } from './compressions';

interface CompressWebpOptions extends PluginOptions<'nc'>
{
    compression: Omit<sharp.WebpOptions, 'force'>;
}

export const webpDefaults: CompressWebpOptions['compression'] = {
    quality: 80
};

// converts png, jpg, jpeg
export function compressWebp(options?: Partial<CompressWebpOptions>): Plugin<CompressWebpOptions>
{
    const defaultOptions: Required<CompressWebpOptions> = {
        compression: {
            ...webpDefaults,
            ...options?.compression
        },
        tags: {
            nc: 'nc',
            ...options?.tags
        }
    };

    return {
        folder: false,
        test(tree, _p, opts)
        {
            const tags = { ...defaultOptions.tags, ...opts.tags } as Required<CompressWebpOptions['tags']>;

            return compression.test.webp(tree.path) && !hasTag(tree, 'path', tags.nc);
        },
        async post(tree, processor, options)
        {
            const webpOpts = {
                ...defaultOptions.compression,
                ...options?.compression
            };
            const input = tree.path;

            try
            {
                const buffer = await compression.compress.to.webp(input, webpOpts);

                compression.save.to.webp(input, buffer, processor, tree, true);
            }
            catch (error)
            {
                throw new Error(`[compressWebp] Failed to compress file to webp: ${input} - ${(error as Error).message}`);
            }
        }
    };
}
