# @assetpack/plugin-image

AssetPack plugin for compressing and mipmapping images into different formats.

## Installation

```sh
npm install --save-dev @assetpack/plugin-image
```

## Basic Usage

```js
import { compress, mipmap } from "@assetpack/plugin-image";

export default {
  ...
  plugins: {
    ...
    mipmap: mipmap(),
    compress: compress(),
  },
};
```

## Options

### compress

- `tags` - An object containing the tags to use for the plugin. Defaults to `{ nc: "nc" }`.
  - `nc` - The tag used to denote that the image should not be compressed. Can be placed on a folder or file.
- jpg: Any settings supported by [sharp](https://sharp.pixelplumbing.com/api-output#jpeg)
- png: Any settings supported by [sharp](https://sharp.pixelplumbing.com/api-output#png)
- webp: Any settings supported by [sharp](https://sharp.pixelplumbing.com/api-output#webp)
- avif: Any settings supported by [sharp](https://sharp.pixelplumbing.com/api-output#avif)

### mipmap

- `template`: A template for denoting the resolution of the images. Defaults to `@%%x`. Note you must use `%%` to denote the resolution.
- `resolutions`: An object containing the resolutions that the images will be resized to. Defaults to `{ default: 1, low: 0.5 }`.
- `fixedResolution`: A resolution used if the fix tag is applied e.g. `path/to/image{fix}.png` or `path/to{fix}`. Resolution must match one found in resolutions. Defaults to `default`.
- `tags` - An object containing the tags to use for the plugin. Defaults to `{ fix: "fix" }`.
