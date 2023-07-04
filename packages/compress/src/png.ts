import type { Plugin, PluginOptions } from '@assetpack/core';
import { hasTag } from '@assetpack/core';
import type sharp from 'sharp';
import { compression } from './compressions';

interface CompressPngOptions extends PluginOptions<'nc'>
{
    compression: Omit<sharp.PngOptions, 'force'>;
}

export const pngDefaults: CompressPngOptions['compression'] = {
    quality: 90
};

// converts png, jpg, jpeg
export function compressPng(options?: Partial<CompressPngOptions>): Plugin<CompressPngOptions>
{
    const defaultOptions: Required<CompressPngOptions> = {
        compression: {
            ...pngDefaults,
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
            const tags = { ...defaultOptions.tags, ...opts.tags } as Required<CompressPngOptions['tags']>;

            return compression.test.png(tree.path) && !hasTag(tree, 'path', tags.nc);
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
                const buffer = await compression.compress.to.png(input, pngOpts);

                compression.save.to.png(input, buffer, processor, tree);
            }
            catch (error)
            {
                throw new Error(`[compressPng] Failed to compress png: ${input} - ${(error as Error).message}`);
            }
        }
    };
}
