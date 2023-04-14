import type { Plugin, PluginOptions } from '@assetpack/core';
import { hasTag } from '@assetpack/core';
import type sharp from 'sharp';
import { compression } from './compressions';

interface CompressJpgOptions extends PluginOptions<'nc'>
{
    compression: Omit<sharp.JpegOptions, 'force'>;
}

export function compressJpg(options?: Partial<CompressJpgOptions>): Plugin<CompressJpgOptions>
{
    const defaultOptions: Required<CompressJpgOptions> = {
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
            const tags = { ...defaultOptions.tags, ...opts.tags } as Required<CompressJpgOptions['tags']>;

            return compression.test.jpg(tree.path) && !hasTag(tree, 'path', tags.nc);
        },
        async post(tree, processor, options)
        {
            const jpgOptions: CompressJpgOptions['compression'] = {
                ...defaultOptions.compression,
                ...options.compression,
            };
            const input = tree.path;

            try
            {
                const buffer = await compression.compress.to.jpg(input, jpgOptions);

                compression.save.to.jpg(input, buffer, processor, tree);
            }
            catch (error)
            {
                throw new Error(`[compressJpg] Failed to compress jpg: ${input} - ${(error as Error).message}`);
            }
        }
    };
}
