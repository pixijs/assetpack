import type { Plugin, PluginOptions } from '@assetpack/core';
import { hasTag } from '@assetpack/core';
import type { WebpOptions, PngOptions, AvifOptions, JpegOptions } from 'sharp';
import { compression } from './compressions';
import { webpDefaults } from './webp';
import { pngDefaults } from './png';
import { avifDefaults } from './avif';
import { jpgDefaults } from './jpg';

export interface CompressOptions extends PluginOptions<'nc'>
{
    webp: Omit<WebpOptions, 'force'> | false
    png: Omit<PngOptions, 'force'> | false
    avif: Omit<AvifOptions, 'force'> | false
    jpg: Omit<JpegOptions, 'force'> | false
}

// converts png, jpg, jpeg
export function compress(options?: Partial<CompressOptions>): Plugin<CompressOptions>
{
    const combineOptions = (type: keyof CompressOptions, defaults: WebpOptions | PngOptions | AvifOptions | JpegOptions) =>
    {
        if (options?.[type] === false) return false;

        return {
            ...defaults,
            ...options?.[type]
        };
    };

    const defaultOptions: Required<CompressOptions> = {
        webp: combineOptions('webp', webpDefaults),
        png: combineOptions('png', pngDefaults),
        avif: combineOptions('avif', avifDefaults),
        jpg: combineOptions('jpg', jpgDefaults),
        tags: {
            nc: 'nc',
            ...options?.tags
        }
    };

    return {
        folder: false,
        test(tree, _p, opts)
        {
            const tags = { ...defaultOptions.tags, ...opts.tags } as Required<CompressOptions['tags']>;
            const nc = hasTag(tree, 'path', tags.nc);

            if (nc) return false;

            for (const key in compression.test)
            {
                // skip if the plugin is disabled
                if (
                    opts[key as keyof typeof opts] === false
                    || defaultOptions[key as keyof typeof defaultOptions] === false
                ) continue;

                const testFn = compression.test[key as keyof typeof compression.test];

                if (testFn(tree.path)) return true;
            }

            return false;
        },
        async post(tree, processor, options)
        {
            const promises: Promise<void>[] = [];

            for (const key in compression.test)
            {
                // skip if the plugin is disabled
                if (
                    options[key as keyof typeof options] === false
                        || defaultOptions[key as keyof typeof defaultOptions] === false
                ) continue;

                const testFn = compression.test[key as keyof typeof compression.test];

                if (testFn(tree.path))
                {
                    // now we convert the file
                    const opts = {
                        ...defaultOptions[key as keyof typeof defaultOptions],
                        ...options[key as keyof typeof options]
                    };

                    promises.push(new Promise(async (resolve) =>
                    {
                        const res = await compression.compress.to[
                            key as keyof typeof compression.compress.to
                        ](tree.path, opts);
                        // now we save the file

                        compression.save.to[key as keyof typeof compression.save.to](tree.path, res, processor, tree);

                        resolve();
                    }));
                }
            }

            await Promise.all(promises);
        }
    };
}
