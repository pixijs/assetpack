// ////ts-nocheck
import type { Plugin, PluginOptions } from '@assetpack/core';
import { checkExt, hasTag, path, SavableAssetCache } from '@assetpack/core';
import type { BitmapFontOptions } from 'msdf-bmfont-xml';
import generateBMFont from 'msdf-bmfont-xml';
import fs from 'fs-extra';

export interface SDFFontOptions extends PluginOptions<'font'>
{
    font: Omit<BitmapFontOptions, 'outputType' | 'fieldType'>;
}

interface DefaultOptions extends Required<SDFFontOptions>
{
    font: BitmapFontOptions;
}

export function signedFont(
    name: string,
    type: BitmapFontOptions['fieldType'],
    tag: string,
    options?: Partial<SDFFontOptions>
): Plugin<SDFFontOptions>
{
    const defaultOptions: DefaultOptions = {
        font: {
            ...options?.font,
            fieldType: type,
        },
        tags: {
            font: tag,
            ...options?.tags
        },
    };

    return {
        folder: false,
        name,
        test(tree, _p, options)
        {
            const opts = { ...defaultOptions.tags, ...options.tags } as Required<SDFFontOptions['tags']>;

            if (!hasTag(tree, 'path', opts.font)) return false;

            return checkExt(tree.path, '.ttf');
        },
        async transform(tree, processor, optionsOverrides)
        {
            const opts = { ...defaultOptions.font, ...optionsOverrides.font } as DefaultOptions['font'];
            const input = tree.path;
            const output = processor.inputToOutput(input, '.fnt');

            opts.filename = opts.filename ?? processor.removeTagsFromPath(path.basename(input, path.extname(input)));

            const res = await GenerateFont(input, {
                ...opts,
                outputType: 'xml',
            });

            const fntData = res.font.data;

            processor.addToTreeAndSave({
                tree,
                outputOptions: {
                    outputPathOverride: output,
                    outputData: fntData
                },
                transformOptions: {
                    transformId: this.name!,
                }
            });

            res.textures.forEach(({ filename, texture }) =>
            {
                const name = `${path.join(path.dirname(output), filename)}.png`;

                processor.saveToOutput({
                    tree,
                    outputOptions: {
                        outputData: texture,
                        outputPathOverride: name,
                    }
                });
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

export function sdfFont(options?: Partial<SDFFontOptions>): Plugin<SDFFontOptions>
{
    return signedFont('sdf-font', 'sdf', 'sdf', options);
}

export function msdfFont(options?: Partial<SDFFontOptions>): Plugin<SDFFontOptions>
{
    return signedFont('msdf-font', 'msdf', 'msdf', options);
}

async function GenerateFont(input: string, params: BitmapFontOptions): Promise<{
    textures: { filename: string, texture: Buffer }[],
    font: { filename: string, data: string }
}>
{
    return new Promise((resolve, reject) =>
    {
        const fontBuffer = fs.readFileSync(input);

        generateBMFont(fontBuffer, params, (err, textures, font) =>
        {
            if (err)
            {
                reject(err);
            }
            else
            {
                resolve({ textures, font });
            }
        });
    });
}
