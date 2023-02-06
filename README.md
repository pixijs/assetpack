<div align="center">
    <h1>AssetPack</h1>
    <h3>Optimising assets for the web!</h3>
</div>
<br>

AssetPack is a tool for optimising assets for the web. It can be used to transform, combine, compress assets. Any asset that you want to transform or optimise into something else can be done with AssetPack.

Assetpack is framework agnostic, and can be used with any framework you like, such as PixiJS, Threejs, Phaser, etc. It uses a plugin based system to allow you to create your own plugins to do whatever you want with your assets.

## Why AssetPack?

AssetPack was designed to solve the problem of having assets come in many different formats, and having to convert them into a format that is suitable for your game. For example, you might have been given an audio file, e.g. `music.wav`, to be put in your game, but to get the best coverage across browsers, you need to convert it into an `ogg` and `mp3` file. AssetPack can do this for you, and you can even compress the audio file to reduce the size of the file.

AssetPack can also be used to combine multiple images into a single sprite sheet, or to generate multiple sizes of an image. This can be useful if you want to support different screen sizes, or if you want to reduce the number of HTTP requests your game makes.

## Installation

```bash
npm install --save-dev @assetpack/core @assetpack/cli
```

## Usage

### Config File

AssetPack uses a config file to define what assets you want to optimise and how you want to optimise them. The config file is a JavaScript file that exports an object with the following properties:

- `entry`: The directory where your raw assets are located.
- `output`: The directory where you want your optimised assets to be outputted to.
- `plugins`: An object containing the plugins you want to use. The key is the name of the plugin, and the value is the plugin itself.
- `ignore`: an optional array of ignore patterns. Any file path matching the patterns will not be processed by assetpack
- `cache`: an optional boolean to enable or disable caching. Defaults to true.
- `logLevel`: an optional string to set the log level. Defaults to 'info'.
- `files`: an optional object to override the settings and tags of any assets. See [Config Overrides](#config-overrides) for more details.

#### Example

```js
// .assetpack.js
import { compressJpg, compressPng } from "@assetpack/plugin-compress";
import { pixiManifest } from "@assetpack/plugin-manifest";

export default {
  entry: "./raw-assets",
  output: "./public",
  plugins: {
    compressJpg: compressJpg(),
    compressPng: compressPng(),
    manifest: pixiManifest(),
  },
};
```

### CLI

AssetPack comes with a simple CLI that can be used to run AssetPack. You can run AssetPack by running the following command:

```json
{
  "scripts": {
    "build:assets": "assetpack -c .assetpack.js"
  }
}
```

### Folder Structure and Tags

AssetPack has a concept called tags. Tags can be placed on any folder/asset and provide a hint to each plugin as to what it is meant to be used for.

```bash
raw-assets
├── preload{m}
│   └── loader.jpg
└── game{m}
    └── frames{tps}
        ├── char.png
        └── pickup.png
```

As you can see here we have a `{tps}` tag and a `{m}` tag. The `{tps}` tag tells `@assetpack/plugin-texture-packer` plugin that all images inside this folder should be used to create a spritesheet.

Also each asset can have multiple tags if needed:

```bash
raw-assets
└── game{multiple}{tags}{here}
    └── ...
```

Each plugin can define what tags it supports. For example, the `@assetpack/plugin-texture-packer` plugin supports the `{tps}` tag, and the `@assetpack/plugin-manifest` plugin supports the `{m}` tag.

### Plugins

AssetPack comes with a few plugins to get you started. You can also create your own plugins to do whatever you want with your assets.

- [compress](./packages/compress/README.md): Compresses images using sharp
  - `compressJpg`: Compresses `jpg` images
  - `compressPng`: Compresses `png` images
  - `compressWebp`: Compresses `png` and `jpg` images into `webp`
  - `compressAvif`: Compresses `png` and `jpg` images into `avif`
- [ffmpeg](./packages/ffmpeg/README.md): Converts files using ffmpeg. E.g. `wav` to `mp3`&`ogg`
  - `ffmpeg`: Exposes the full ffmpeg API to convert any file to any other file
  - `audio`: Converts audio files to `mp3` and `ogg`
- [json](./packages/json/README.md): Minifies JSON files
- [mipmap](./packages/mipmap/README.md): Generates multiple sizes of an image. e.g. `image.png` to `image@1x.png` and `image@0.5x.png`
  - `mipmap`: General purpose mipmap generator
  - `spineAtlasMipmap`: Generates multiple sizes of a spine atlas file
- [texture-packer](./packages/texture-packer/README.md): Packs multiple images into a sprite sheet
- [webfont](./packages/webfont/README.md): Generates woff2 fonts from ttf, oft, svg, and woff files
- [manifest](./packages/manifest/README.md): Generates a Pixi v7 specific manifest file to load your assets

## Examples

Head on over the Pixi's [Open Games](https://github.com/pixijs/open-games) repository to see how AssetPack is used in the wild!
There are several open source games in that repository that are using AssetPack to optimise their assets.

# Advanced Usage

## Custom Plugins

You can create your own plugins to do whatever you want with your assets. A plugin is just a function that returns an object with the following properties:

TODO

## Config Overrides

AssetPack allows you to override the settings and tags of any assets through the `files` property in the config file. This is useful if you want to override the settings of a plugin for a specific asset.

```js
...

export default {
    ...
    files: [
      {
        // This will apply these settings to folders ending with -tps
        files: ['/**/*-tps'],
        // You can set what tags are applied to the asset
        // Tags are usually a string but can be an array or an object
        // e.g. {name: 'hi', data: {foo: 'bar'}}
        tags: ['hi'],
        // Using the name of the plugin, you can override the settings for that plugin
        settings: {
            ['texture-packer']: {
                // override the tag the plugin uses to find the assets
                tags: {
                    tps: 'hi'
                },
                resolutionOptions: {
                    // override the resolution options for the plugin
                    resolutions: {high: 2, default: 1, low: 0.5}
                }
            }
        }
      }
    ]
};
```
