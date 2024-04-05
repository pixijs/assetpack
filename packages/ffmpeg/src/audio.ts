import { merge } from '@play-co/assetpack-core';
import type { AssetPipe } from '@play-co/assetpack-core';
import type { FfmpegOptions } from './ffmpeg';
import { ffmpeg } from './ffmpeg';

export function audio(_options?: FfmpegOptions): AssetPipe
{
    // default settings for converting mp3, ogg, wav to mp3, ogg
    const defaultOptions: FfmpegOptions = {
        name: 'audio',
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

    const audio = ffmpeg(merge(true, defaultOptions, _options));

    return audio;
}
