---
sidebar_position: 1
title: Pixi
---

# PixiJS Setup

While AssetPack can be used with any rendering engine, we have provided an opinionated setup for PixiJS. This setup is not required, but it can help you get started quickly.

This setup also abstracts away some of the more complex features of AssetPack, to ensure that all options are passed to the plugins correctly, and plugins are set up in the correct order.

## API

| Option        | Type                         | Description                                                                                      |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| cacheBust     | `boolean`                    | Whether to append a cache-busting query string to the asset URLs. Defaults to `true`             |
| resolutions   | `Record<string, number>`     | A map of resolution names to scaling factors. Defaults to `{ default: 1, low: 0.5 }`             |
| compression   | `CompressOptions` \| `false` | Options for compressing the output files. Defaults to `{ jpg: true, png: true, webp: true }`     |
| texturePacker | `TexturePackerOptions`       | Options for generating texture atlases. Defaults to `{ texturePacker: { nameStyle: 'short' }}` |
| audio         | `Partial<FfmpegOptions>`     | Options for compressing audio files. Defaults to `{}`                                            |
| manifest      | `PixiManifestOptions`        | Options for generating a PixiJS manifest file. Defaults to `{ createShortcuts: true }`           |

- [CompressOptions](/docs/guide/pipes/compress#api)
- [TexturePackerOptions](/docs/guide/pipes/texture-packer#api)
- [PixiManifestOptions](/docs/guide/pipes/manifest#api)
- [Resolutions](/docs/guide/pipes/mipmap#api)

## Example

Please refer to the [API Reference](/docs/guide/configuration) for the full list of options.

```js
import { pixiPipes } from "@assetpack/core/pixi";

export default {
  ...
  pipes: [
    ...pixiPipes({
        cacheBust: true,
        resolutions: { default: 1, low: 0.5 },
        compression: { jpg: true, png: true, webp: true },
        texturePacker: { nameStyle: "short" },
        audio: {},
        manifest: { createShortcuts: true },
    }),
  ],
};
```
