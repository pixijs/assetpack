import type { Processor, TransformedTree } from '@assetpack/core';
import { SavableAssetCache, checkExt, path } from '@assetpack/core';
import sharp from 'sharp';

type SharpOptions = Omit<sharp.JpegOptions, 'force'> |
Omit<sharp.PngOptions, 'force'> |
Omit<sharp.WebpOptions, 'force'> |
Omit<sharp.AvifOptions, 'force'>;

const compress = {
    to: {
        png: async (input: string, compression: SharpOptions) =>
            await sharp(input).png({ ...compression, force: true }).toBuffer(),
        webp: async (input: string, compression: SharpOptions) =>
            await sharp(input).webp({ ...compression, force: true }).toBuffer(),
        avif: async (input: string, compression: SharpOptions) =>
            await sharp(input).avif({ ...compression, force: true }).toBuffer(),
        jpg: async (input: string, compression: SharpOptions) =>
            await sharp(input).jpeg({ ...compression, force: true }).toBuffer(),
    }
};

function saveToOutput(buffer: Buffer, output: string, processor: Processor, tree: TransformedTree)
{
    processor.saveToOutput({
        tree,
        outputOptions: {
            outputData: buffer,
            outputPathOverride: output,
        },
    });
}

function addToSavableAssetCache(output: string, processor: Processor, tree: TransformedTree)
{
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

const save = {
    to: {
        png: async (output: string, buffer: Buffer, processor: Processor, tree: TransformedTree) =>
        {
            saveToOutput(buffer, output, processor, tree);
        },
        jpg: async (output: string, buffer: Buffer, processor: Processor, tree: TransformedTree) =>
        {
            saveToOutput(buffer, output, processor, tree);
        },
        webp: async (output: string, buffer: Buffer, processor: Processor, tree: TransformedTree, addToCache = true) =>
        {
            const newInput = output.replace(/\.(png|jpg|jpeg)$/i, '.webp');

            saveToOutput(buffer, newInput, processor, tree);

            if (addToCache)
            {
                addToSavableAssetCache(newInput, processor, tree);
            }
        },
        avif: async (output: string, buffer: Buffer, processor: Processor, tree: TransformedTree, addToCache = true) =>
        {
            const newInput = output.replace(/\.(png|jpg|jpeg)$/i, '.avif');

            saveToOutput(buffer, newInput, processor, tree);

            if (addToCache)
            {
                addToSavableAssetCache(newInput, processor, tree);
            }
        }
    }
};

const test = {
    png: (input: string) => checkExt(input, '.png'),
    jpg: (input: string) => checkExt(input, '.jpg', '.jpeg'),
    webp: (input: string) => checkExt(input, '.png', '.jpg', '.jpeg'),
    avif: (input: string) => checkExt(input, '.png', '.jpg', '.jpeg'),
};

export const compression
= {
    compress,
    save,
    test,
};
