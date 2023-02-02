import type { Plugin } from '@assetpack/core';
import { merge } from '@assetpack/core';
import type { FfmpegOptions } from './ffmpeg';
import { ffmpeg } from './ffmpeg';

export function audio(options?: FfmpegOptions): Plugin<FfmpegOptions>
{
    // default settings for converting mp3, ogg, wav to mp3, ogg
    let defaultOptions: FfmpegOptions = {
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

    const audio = ffmpeg(defaultOptions);

    audio.name = 'audio';

    return audio;
}
