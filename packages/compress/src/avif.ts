import type { Plugin, PluginOptions } from '@assetpack/core';
import { checkExt, hasTag, path, SavableAssetCache } from '@assetpack/core';
import type sharp from 'sharp';
import { sharpCompress } from './utils';

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

            return checkExt(tree.path, '.png', '.jpg', '.jpeg') && !hasTag(tree, 'path', tags.nc);
        },
        async post(tree, processor, options)
        {
            const avif = {
                ...defaultOptions.compression,
                ...options?.compression
            };
            const input = tree.path;
            const output = tree.path.replace(/\.(png|jpg|jpeg)$/i, '.avif');

            try
            {
                await sharpCompress('avif', { input, processor, tree, compression: avif, output });

                const asset  = SavableAssetCache.get(tree.creator);
                const trimmed = processor.trimOutputPath(output);

                asset.transformData.files.forEach((f) =>
                {
                    const paths = f.paths.find((t) => t.includes(path.trimExt(trimmed)));

                    if (paths)
                    {
                        f.paths.push(trimmed);
                    }
                });

                SavableAssetCache.set(tree.creator, asset);
            }
            catch (error)
            {
                throw new Error(`[compressAvif] Failed to compress file to avif: ${input} - ${(error as Error).message}`);
            }
        }
    };
}
