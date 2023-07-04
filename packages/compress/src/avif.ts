import type { Plugin, PluginOptions } from '@assetpack/core';
import { hasTag } from '@assetpack/core';
import type sharp from 'sharp';
import { compression } from './compressions';

interface CompressAvifOptions extends PluginOptions<'nc'>
{
    compression: Omit<sharp.AvifOptions, 'force'>;
}

// converts png, jpg, jpeg
export function compressAvif(options?: Partial<CompressAvifOptions>): Plugin<CompressAvifOptions>
{
    const defaultOptions: Required<CompressAvifOptions> = {
        compression: {
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
            const tags = { ...defaultOptions.tags, ...opts.tags } as Required<CompressAvifOptions['tags']>;

            return compression.test.avif(tree.path) && !hasTag(tree, 'path', tags.nc);
        },
        async post(tree, processor, options)
        {
            const avif = {
                ...defaultOptions.compression,
                ...options?.compression
            };
            const input = tree.path;

            try
            {
                const buffer = await compression.compress.to.avif(input, avif);

                compression.save.to.avif(input, buffer, processor, tree, true);
            }
            catch (error)
            {
                throw new Error(`[compressAvif] Failed to compress file to avif: ${input} - ${(error as Error).message}`);
            }
        }
    };
}

export const avifDefaults: CompressAvifOptions['compression'] = {};
