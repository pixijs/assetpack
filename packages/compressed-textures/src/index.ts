import type { Plugin, PluginOptions, Processor, RootTree, TransformedTree } from '@assetpack/core';
import { SavableAssetCache, checkExt, hasTag, path } from '@assetpack/core';
import * as TEX from 'gpu-tex-enc';
import fs from 'fs-extra';
import { sep } from 'path';
import { tmpdir } from 'os';
import type {
    AstcTexOptions,
    BcTexOptions,
    CompressAstcOptions,
    CompressBcOptions,
    CompressedTexOptions,
    CompressEtcOptions,
    EtcTexOptions,
} from './types';

export const astcDefaults: AstcTexOptions = {
    blocksize: '4x4',
    quality: 'exhaustive',
    colorProfile: 'cl',
    formatName: 'astc',
};

export const bcDefaults: BcTexOptions = {
    type: 'BC7',
    formatName: 'bc7',
    adjustSize: true,
};

export const etcDefaults: EtcTexOptions = {
    format: 'RGBA8',
    errormetric: 'rgbx',
    effort: 100,
    formatName: 'etc',
};

// converts png to ETC in ktx
export function generateEtc(options?: Partial<CompressEtcOptions>): Plugin<CompressEtcOptions>
{
    const defaultOptions: Required<CompressEtcOptions> = {
        compression: {
            ...etcDefaults,
            ...options?.compression,
        },
        tags: {
            nc: 'nc',
            ...options?.tags,
        },
    };

    return {
        folder: false,
        test(tree, _p, opts)
        {
            return test(tree, defaultOptions, opts, '.png');
        },
        async post(tree, processor, options)
        {
            const etc = buildCompressionOptions(defaultOptions, options);

            try
            {
                await generateTex(tree, processor, etc.formatName,
                    TEX.generateETC, etc.format, etc.effort, etc.errormetric, etc.options);
            }
            catch (error)
            {
                throw new Error(`[compressEtc] Failed to compress file to etc:
                ${tree.path} - ${(error as Error).message}`);
            }
        },
    };
}

// converts png to BCn in dds
export function generateBc(options?: Partial<CompressBcOptions>): Plugin<CompressBcOptions>
{
    const defaultOptions: Required<CompressBcOptions> = {
        compression: {
            ...bcDefaults,
            ...options?.compression,
        },
        tags: {
            nc: 'nc',
            ...options?.tags,
        },
    };

    return {
        folder: false,
        test(tree, _p, opts)
        {
            return test(tree, defaultOptions, opts, '.png');
        },
        async post(tree, processor, options)
        {
            const bc = buildCompressionOptions(defaultOptions, options);

            try
            {
                await generateTex(tree, processor, bc.formatName, TEX.generateBC, bc.type, bc.adjustSize, bc.options);
            }
            catch (error)
            {
                throw new Error(`[compressBc] Failed to compress file to ${bc.type}:
                ${tree.path} - ${(error as Error).message}`);
            }
        },
    };
}

// converts png to astc in ktx
export function generateAstc(options?: Partial<CompressAstcOptions>): Plugin<CompressAstcOptions>
{
    const defaultOptions: Required<CompressAstcOptions> = {
        compression: {
            ...astcDefaults,
            ...options?.compression,
        },
        tags: {
            nc: 'nc',
            ...options?.tags,
        },
    };

    return {
        folder: false,
        test(tree, _p, opts)
        {
            return test(tree, defaultOptions, opts, '.png', '.jpg', '.jpeg');
        },
        async post(tree, processor, options)
        {
            const astc = buildCompressionOptions(defaultOptions, options);

            try
            {
                await generateTex(tree, processor, astc.formatName, TEX.generateASTC,
                    astc.blocksize, astc.quality, astc.colorProfile, astc.options);
            }
            catch (error)
            {
                throw new Error(`[compressAstc] Failed to compress file to astc:
                ${tree.path} - ${(error as Error).message}`);
            }
        },
    };
}

export function generateCompressedTex(options?: Partial<CompressedTexOptions>): Plugin<CompressedTexOptions>
{
    const defaultEnabled = ['ASTC', 'BC7', 'RGBA8'];

    function combineOptions<T>(type: keyof CompressedTexOptions, defaults: T): T | false
    {
        if (options?.[type] === false) return false;
        if (!options?.[type] && !defaultEnabled.includes(type)) return false;

        return {
            ...defaults,
            ...options?.[type],
        };
    }

    const defaultOptions: Required<CompressedTexOptions> = {
        ASTC: combineOptions('ASTC', astcDefaults),

        BC1: combineOptions('BC1', bcDefaults),
        BC3: combineOptions('BC3', bcDefaults),
        BC4: combineOptions('BC4', bcDefaults),
        BC5: combineOptions('BC5', bcDefaults),
        BC7: combineOptions('BC7', bcDefaults),

        ETC1: combineOptions('ETC1', etcDefaults),
        RGB8: combineOptions('RGB8', etcDefaults),
        SRGB8: combineOptions('SRGB8', etcDefaults),
        RGBA8: combineOptions('RGBA8', etcDefaults),
        SRGBA8: combineOptions('SRGBA8', etcDefaults),
        RGB8A1: combineOptions('RGB8A1', etcDefaults),
        SRGB8A1: combineOptions('SRGB8A1', etcDefaults),
        R11: combineOptions('R11', etcDefaults),
        SIGNED_R11: combineOptions('SIGNED_R11', etcDefaults),
        RG11: combineOptions('RG11', etcDefaults),
        SIGNED_RG11: combineOptions('SIGNED_RG11', etcDefaults),
        tags: {
            nc: 'nc',
            ...options?.tags,
        },
    };

    return {
        folder: false,
        test(tree, _p, opts)
        {
            return test(tree, defaultOptions, opts, '.png');
        },
        async post(tree, processor, options)
        {
            const texturesOptions = {} as any;

            for (const tex in defaultOptions)
            {
                // skip if the plugin is disabled
                if (
                    options[tex as keyof typeof options] === false
                    || defaultOptions[tex as keyof typeof defaultOptions] === false
                    || tex === 'tags'
                ) continue;

                texturesOptions[tex] = {
                    ...defaultOptions[tex as keyof typeof defaultOptions],
                    ...options[tex as keyof typeof options],
                };
            }

            try
            {
                const output = await executeInTemporaryDir(tree.path, (input) => TEX.generate(input, texturesOptions));

                for (const [key, value] of Object.entries(output))
                {
                    if (value)
                    {
                        const filePath = processor.saveToOutput({
                            tree,
                            outputOptions: {
                                outputData: fs.readFileSync(value),
                                outputExtension: `.${texturesOptions[key].formatName}${path.extname(value)}`,
                            },
                        });

                        addToSavableAssetCache(filePath, processor, tree);
                    }
                }
            }
            catch (error)
            {
                throw new Error(`[compressEtc] Failed to compress file to etc:
                ${tree.path} - ${(error as Error).message}`);
            }
        },
    };
}

export const generate = {
    etc: async (input: string, etc?: Partial<EtcTexOptions>) =>
        await executeInTemporaryDir(input,
            (p) => TEX.generateETC(p, etc?.format, etc?.effort, etc?.errormetric, etc?.options)),
    astc: async (input: string, astc?: Partial<AstcTexOptions>) =>
        await executeInTemporaryDir(input,
            (p) => TEX.generateASTC(p, astc?.blocksize, astc?.quality, astc?.colorProfile, astc?.options)),
    bc: async (input: string, bc?: Partial<BcTexOptions>) =>
        await executeInTemporaryDir(input,
            (p) => TEX.generateBC(p, bc?.type, bc?.adjustSize, bc?.options)),
};

async function generateTex(tree: TransformedTree, processor: Processor, formatName: string,
    generator: (input: string, ...args: any[]) => Promise<string>, ...args: any[])
{
    return executeInTemporaryDir(tree.path,
        async (input) =>
        {
            const output = await generator(input, ...args);

            const filePath = processor.saveToOutput({
                tree,
                outputOptions: {
                    outputData: await fs.readFile(output),
                    outputExtension: `.${formatName}${path.extname(output)}`,
                },
            });

            addToSavableAssetCache(filePath, processor, tree);

            return output;
        });
}

async function executeInTemporaryDir<T>(filePath: string, fnk: (file: string) => Promise<T>): Promise<T>
{
    const dir = makeTmpDir();
    const fileName = path.basename(filePath);
    const file = `${dir}${fileName}`;

    try
    {
        fs.copyFileSync(filePath, file);

        return fnk(file);
    }
    finally
    {
        fs.rmdirSync(dir);
    }
}

function makeTmpDir()
{
    return fs.mkdtempSync(`${tmpdir()}${sep}`);
}

function test<T extends PluginOptions<'nc'>>(tree: RootTree | TransformedTree,
    defaultOptions: Required<T>, opts: Partial<T>, ...ext: string[]): boolean
{
    const tags = { ...defaultOptions.tags, ...opts.tags } as Required<PluginOptions<'nc'>['tags']>;

    return checkExt(tree.path, ...ext) && !hasTag(tree, 'path', tags.nc);
}

function buildCompressionOptions<T extends CompressEtcOptions | CompressBcOptions | CompressAstcOptions>(defaultOptions: T,
    options?: T): Required<T['compression']>
{
    return {
        ...defaultOptions.compression,
        ...options?.compression,
    } as Required<T['compression']>;
}

function addToSavableAssetCache(output: string, processor: Processor, tree: TransformedTree)
{
    const asset  = SavableAssetCache.get(tree.creator);
    const trimmed = processor.trimOutputPath(output);
    const trimmedSource = processor.trimOutputPath(path.trimExt(tree.path));

    asset.transformData.files.forEach((f) =>
    {
        const paths = f.paths.find((t) => t.includes(trimmedSource));

        if (paths)
        {
            f.paths.push(trimmed);
        }
    });

    SavableAssetCache.set(tree.creator, asset);
}
