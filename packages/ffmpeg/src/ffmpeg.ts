import type { AssetPipe, Asset } from '@play-co/assetpack-core';
import { checkExt, createNewAssetAt, path } from '@play-co/assetpack-core';
import fluentFfmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import fs from 'fs-extra';

fluentFfmpeg.setFfmpegPath(ffmpegPath.path);

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
    name?: string;
    inputs: string[];
    outputs: FfmpegData[];
}

async function convert(ffmpegOptions: FfmpegData, input: string, output: string, extension: string)
{
    return new Promise<void>(async (resolve, reject) =>
    {
        let hasOutput = false;
        const command = fluentFfmpeg();

        await fs.ensureDir(path.dirname(output));

        // add each format to the command as an output
        ffmpegOptions.formats.forEach((format) =>
        {
            if (ffmpegOptions.recompress || format !== extension)
            {
                command.output(output);
                hasOutput = true;
            }
            else
            {
                fs.copyFileSync(input, output);
            }
        });

        if (!hasOutput)
        {
            resolve();

            return;
        }

        // add the input file
        command.input(input);

        // add each option to the command
        Object.keys(ffmpegOptions.options).forEach((key) =>
        {
            const value = ffmpegOptions.options[key as FfmpegKeys];

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

export function ffmpeg(defaultOptions: FfmpegOptions): AssetPipe<FfmpegOptions>
{
    return {
        folder: false,
        name: 'ffmpeg',
        defaultOptions,
        test(asset: Asset, options)
        {
            if (!options.inputs.length)
            {
                throw new Error('[ffmpeg] No inputs defined');
            }

            return checkExt(asset.path, ...options.inputs);
        },
        async transform(asset: Asset, options)
        {
            // merge options with defaults
            const extension = path.extname(asset.path);

            const baseFileName = asset.filename.replace(extension, '');

            const promises: Promise<void>[] = [];

            const assets: Asset[] = [];

            options.outputs.forEach((output) =>
            {
                const newFileName = `${baseFileName}${output.formats[0]}`;
                const newAsset = createNewAssetAt(asset, newFileName);

                promises.push(convert(output, asset.path, newAsset.path, extension));

                assets.push(newAsset);
            });

            await Promise.all(promises);

            return assets;
        }
    };
}
