import type { Plugin, PluginOptions } from '@assetpack/core';
import { checkExt, hasTag, path, SavableAssetCache } from '@assetpack/core';
import { fonts } from './fonts';

export type WebfontOptions = PluginOptions<'font'>;

export function webfont(options?: WebfontOptions): Plugin<WebfontOptions>
{
    const defaultOptions: WebfontOptions = {
        tags: {
            font: 'wf',
            ...options?.tags
        },
    };

    return {
        folder: false,
        name: 'webfont',
        test(tree, _p, options)
        {
            const opts = { ...defaultOptions.tags, ...options.tags } as Required<WebfontOptions['tags']>;

            if (!hasTag(tree, 'path', opts.font)) return false;

            return checkExt(tree.path, '.otf', '.ttf', '.svg');
        },
        async transform(tree, processor)
        {
            const ext = path.extname(tree.path);
            const input = tree.path;
            const output = processor.inputToOutput(input, '.woff2');

            let res: Buffer | null = null;

            switch (ext)
            {
                case '.otf':
                    res = fonts.otf.to.woff2(input);
                    break;
                case '.ttf':
                    res = fonts.ttf.to.woff2(input);
                    break;
                case '.svg':
                    res = fonts.svg.to.woff2(input);
                    break;
            }

            processor.addToTreeAndSave({
                tree,
                outputOptions: {
                    outputPathOverride: output,
                    outputData: res
                },
                transformOptions: {
                    transformId: 'webfont',
                }
            });

            SavableAssetCache.set(tree.path, {
                tree,
                transformData: {
                    type: this.name!,
                    files: [{
                        name: processor.trimOutputPath(processor.inputToOutput(tree.path)),
                        paths: [output]
                    }]
                }
            });
        }
    };
}
