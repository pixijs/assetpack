import type { Plugin, PluginOptions } from '@assetpack/core';
import { checkExt, hasTag } from '@assetpack/core';
import type sharp from 'sharp';
import { sharpCompress } from './utils';

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

            return checkExt(tree.path, '.jpg', '.jpeg') && !hasTag(tree, 'path', tags.nc);
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
                await sharpCompress('jpeg', { input, processor, tree, compression: jpgOptions });
            }
            catch (error)
            {
                throw new Error(`[compressJpg] Failed to compress jpg: ${input} - ${(error as Error).message}`);
            }
        }
    };
}
