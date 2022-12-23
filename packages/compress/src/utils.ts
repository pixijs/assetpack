import type { Processor, RootTree, TransformedTree } from '@assetpack/core';
import sharp from 'sharp';

type SharpOptions = Omit<sharp.JpegOptions, 'force'> |
Omit<sharp.PngOptions, 'force'> |
Omit<sharp.WebpOptions, 'force'> |
Omit<sharp.AvifOptions, 'force'>;

export async function sharpCompress(type: 'png' | 'jpeg' | 'webp' | 'avif', data: {
    input: string;
    output?: string;
    processor: Processor;
    tree: RootTree | TransformedTree;
    compression: SharpOptions
})
{
    const { input, processor, tree, compression, output } = data;
    const res = await sharp(input)[type]({ ...compression, force: true }).toBuffer();

    processor.saveToOutput({
        tree,
        outputOptions: {
            outputData: res,
            outputPathOverride: output ?? input,
        },
    });
}
