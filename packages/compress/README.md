# @assetpack/plugin-compress

AssetPack plugin for compressing images using sharp.

## Installation

```sh
npm install --save-dev @assetpack/plugin-compress
```

## Usage

```js
import { compressJpg, compressPng, compressWebp } from "@assetpack/plugin-compress";

export default {
  ...
  plugins: {
    ...
    compressJpg: compressJpg(),
    compressPng: compressPng(),
    compressWebp: compressWebp(),
  },
};
```

## Options

### compressJpg

- compression: Any settings supported by [sharp](https://sharp.pixelplumbing.com/api-output#jpeg)
- `tags` - An object containing the tags to use for the plugin. Defaults to `{ nc: "nc" }`.
  - `nc` - The tag used to denote that the image should not be compressed. Can be placed on a folder or file.

### compressPng

- compression: Any settings supported by [sharp](https://sharp.pixelplumbing.com/api-output#png)
- `tags` - An object containing the tags to use for the plugin. Defaults to `{ nc: "nc" }`.
  - `nc` - The tag used to denote that the image should not be compressed. Can be placed on a folder or file.

### compressWebp

- compression: Any settings supported by [sharp](https://sharp.pixelplumbing.com/api-output#webp)
- `tags` - An object containing the tags to use for the plugin. Defaults to `{ nc: "nc" }`.
  - `nc` - The tag used to denote that the image should not be compressed. Can be placed on a folder or file.
