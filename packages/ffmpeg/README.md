# @assetpack/plugin-ffmpeg

AssetPack plugin for converting files using ffmpeg.

There are two plugins exposed by this package:

- `audio`: Converts and compresses `mp3`, `wav`, and `ogg` audio files to `mp3` and `ogg`.
- `ffmpeg`: Exposes the full `ffmpeg` API to convert any file to any other file

## Installation

```sh
npm install --save-dev @assetpack/plugin-ffmpeg
```

You also need to install `ffmpeg` on your system. You can find instructions on how to do that [here](https://www.ffmpeg.org/download.html).

## Basic Usage

```js
import { audio } from "@assetpack/plugin-ffmpeg";

export default {
  ...
  plugins: {
    ...
    audio: audio(),
  },
};
```

## Advanced Usage

```js
import { ffmpeg } from "@assetpack/plugin-ffmpeg";

export default {
  ...
  plugins: {
    ...
    // ffmpeg plugin takes an input array of extensions and produces an output based on the options
    // You can pass any ffmpeg options to the options object
    ffmpeg: ffmpeg({
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
    }),
  },
};
```
