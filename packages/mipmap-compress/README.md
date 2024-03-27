# @assetpack/plugin-mipmap

AssetPack plugin for generating mipmaps
By default this plugin will generate `@1x` and `@0.5x` resolutions for all images.

This plugin also supports generating mipmaps for Spine atlas files with the `spineAtlasMipmap` plugin.

## Installation

```sh
npm install --save-dev @assetpack/plugin-mipmap
```

## Basic Usage

```js
import { mipmap, spineAtlasMipmap } from "@assetpack/plugin-mipmap";

export default {
  ...
  plugins: {
    ...
    mipmap: mipmap(),
    spine: spineAtlasMipmap(),
  },
};
```

## Options

- `template`: A template for denoting the resolution of the images. Defaults to `@%%x`. Note you must use `%%` to denote the resolution.
- `resolutions`: An object containing the resolutions that the images will be resized to. Defaults to `{ default: 1, low: 0.5 }`.
- `fixedResolution`: A resolution used if the fix tag is applied e.g. `path/to/image{fix}.png` or `path/to{fix}`. Resolution must match one found in resolutions. Defaults to `default`.
- `tags` - An object containing the tags to use for the plugin. Defaults to `{ fix: "fix" }`.
