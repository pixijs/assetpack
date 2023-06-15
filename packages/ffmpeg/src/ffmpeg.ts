import type { Plugin, Processor, RootTree } from '@assetpack/core';
import { checkExt, merge, path, SavableAssetCache } from '@assetpack/core';
import fluentFfmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import fs from 'fs-extra';

fluentFfmpeg.setFfmpegPath(ffmpegPath.path);

type DeepRequired<T> = {
    [K in keyof T]: Required<DeepRequired<T[K]>>
};

type FfmpegKeys =
// options/input
'inputFormat' |
'inputFPS' |
'native' |
'seekInput' |
'loop' |
// options/audio
'noAudio' |
'audioCodec' |
'audioBitrate' |
'audioChannels' |
'audioFrequency' |
'audioQuality' |
// options/video
'noVideo' |
'videoCodec' |
'videoBitrate' |
'fps' |
'frames' |
// options/videosize
'size' |
'aspect' |
'autopad' |
'keepDAR' |
// options/outputs
'seek' |
'duration' |
'format' |
'flvmeta';

type FfmpegCommands = {
    [K in FfmpegKeys]: Parameters<fluentFfmpeg.FfmpegCommand[K]>[0] | undefined
};

type FfmpegCommandKeys = keyof typeof fluentFfmpeg.FfmpegCommand.prototype;

export interface FfmpegData
{
    formats: string[];
    recompress: boolean;
    options: Partial<FfmpegCommands>;
}

export interface FfmpegOptions
{
    inputs: string[];
    outputs: FfmpegData[];
}

async function convert(output: FfmpegData, tree: RootTree, extname: string, processor: Processor, name: string)
{
    return new Promise<void>((resolve, reject) =>
    {
        let hasOutput = false;
        const command = fluentFfmpeg();

        const paths: string[] = [];

        // add each format to the command as an output
        output.formats.forEach((format) =>
        {
            const outPath = processor.inputToOutput(tree.path, format);

            fs.ensureDirSync(path.dirname(outPath));

            processor.addToTree({
                tree,
                outputOptions: {
                    outputPathOverride: outPath,
                },
                transformId: 'ffmpeg',
            });

            if (output.recompress || format !== extname)
            {
                command.output(outPath);
                hasOutput = true;
            }
            else
            {
                fs.copySync(tree.path, outPath);
            }

            paths.push(processor.trimOutputPath(outPath));
        });

        if (SavableAssetCache.has(tree.path))
        {
            const cache = SavableAssetCache.get(tree.path);

            cache.transformData.files[0].paths.push(...paths);

            SavableAssetCache.set(tree.path, cache);
        }
        else
        {
            SavableAssetCache.set(tree.path, {
                tree,
                transformData: {
                    type: name,
                    files: [{
                        name: processor.trimOutputPath(processor.inputToOutput(tree.path)),
                        paths,
                    }],
                }
            });
        }

        if (!hasOutput)
        {
            resolve();

            return;
        }

        // add the input file
        command.input(tree.path);

        // add each option to the command
        Object.keys(output.options).forEach((key) =>
        {
            const value = output.options[key as FfmpegKeys];

            if (!command[key as FfmpegCommandKeys]) throw new Error(`[ffmpeg] Unknown option: ${key}`);

            (command as any)[key](value);
        });

        // run the command
        command
            .on('error', reject)
            .on('end', resolve)
            .run();
    });
}

export function ffmpeg(options?: FfmpegOptions): Plugin<FfmpegOptions>
{
    const defaultOptions = merge(true, {
        inputs: [],
        outputs: [],
    } as DeepRequired<FfmpegOptions>, options);

    return {
        folder: false,
        name: 'ffmpeg',
        test(tree, _p, optionOverrides)
        {
            const opts = merge(true, defaultOptions, optionOverrides) as DeepRequired<FfmpegOptions>;

            if (!opts.inputs.length)
            {
                throw new Error('[ffmpeg] No inputs defined');
            }

            return checkExt(tree.path, ...opts.inputs);
        },
        async transform(tree, processor, optionOverrides)
        {
            // merge options with defaults
            const opts = merge(true, defaultOptions, optionOverrides) as DeepRequired<FfmpegOptions>;
            const extname = path.extname(tree.path);
            const promises: Promise<void>[] = [];

            opts.outputs.forEach((output) =>
            {
                promises.push(convert(output, tree, extname, processor, this.name!));
            });

            await Promise.all(promises);
        }
    };
}
