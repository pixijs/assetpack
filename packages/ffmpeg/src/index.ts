import type { Plugin, Processor, RootTree } from '@assetpack/core';
import { merge, path } from '@assetpack/core';
import fluentFfmpeg from 'fluent-ffmpeg';
import { copySync } from 'fs-extra';

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

export interface AudioData
{
    formats: string[];
    recompress: boolean;
    options: Partial<FfmpegCommands>;
}

export interface AudioOptions
{
    inputs: string[];
    outputs: AudioData[];
}

async function convert(output: AudioData, tree: RootTree, extname: string, processor: Processor)
{
    return new Promise<void>((resolve, reject) =>
    {
        let hasOutput = false;
        const command = fluentFfmpeg();

        // add each format to the command as an output
        output.formats.forEach((format) =>
        {
            const outPath = processor.inputToOutput(tree.path, format);

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
                copySync(tree.path, outPath);
            }
        });

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

export function ffmpeg(options?: AudioOptions): Plugin<AudioOptions>
{
    const defaultOptions = merge(true, {
        inputs: [],
        outputs: [],
    } as DeepRequired<AudioOptions>, options);

    return {
        folder: false,
        test(tree, _p, optionOverrides)
        {
            const opts = merge(true, defaultOptions, optionOverrides) as DeepRequired<AudioOptions>;

            if (!opts.inputs)
            {
                throw new Error('[ffmpeg] No inputs defined');
            }

            return opts.inputs.includes(path.extname(tree.path));
        },
        async transform(tree, processor, optionOverrides)
        {
            // merge options with defaults
            const opts = merge(true, defaultOptions, optionOverrides) as DeepRequired<AudioOptions>;
            const extname = path.extname(tree.path);
            const promises: Promise<void>[] = [];

            opts.outputs.forEach((output) =>
            {
                promises.push(convert(output, tree, extname, processor));
            });

            await Promise.allSettled(promises);
        }
    };
}

export function audio(options?: AudioOptions): Plugin<AudioOptions>
{
    // default settings for converting mp3, ogg, wav to mp3, ogg
    let defaultOptions: AudioOptions = {
        inputs: ['.mp3', '.ogg', '.wav'],
        outputs: [
            {
                formats: ['.mp3'],
                recompress: false,
                options: {
                    audioBitrate: 96,
                    audioChannels: 1,
                    audioFrequency: 48000,
                }
            },
            {
                formats: ['.ogg'],
                recompress: false,
                options: {
                    audioBitrate: 32,
                    audioChannels: 1,
                    audioFrequency: 22050,
                }
            },
        ]
    };

    defaultOptions = merge(true, defaultOptions, options);

    return ffmpeg(defaultOptions);
}
