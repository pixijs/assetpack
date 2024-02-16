# @assetpack/plugin-compressed-textures

AssetPack plugin for generation compressed textures.

## Installation

```sh
npm install --save-dev @assetpack/plugin-compressed-textures
```

## Usage

```js
import { generateAstc, generateBc, generateEtc } from '@assetpack/compressed-textures';

export default {
  ...
  plugins: {
    ...
    generateAstc: generateAstc(),
    generateBc: generateBc(),
    generateEtc: generateEtc(),
  },
};
```

## Options

### generateAstc

- compression: Any settings supported by [@gpu-tex-enc/astc](https://www.npmjs.com/package/@gpu-tex-enc/astc)
- `tags` - An object containing the tags to use for the plugin. Defaults to `{ nc: "nc" }`.
  - `nc` - The tag used to denote that the image should not be compressed. Can be placed on a folder or file.

### generateBc

- compression: Any settings supported by [@gpu-tex-enc/bc](https://www.npmjs.com/package/@gpu-tex-enc/bc)
- `tags` - An object containing the tags to use for the plugin. Defaults to `{ nc: "nc" }`.
  - `nc` - The tag used to denote that the image should not be compressed. Can be placed on a folder or file.

### generateEtc

- compression: Any settings supported by [@gpu-tex-enc/etc](https://www.npmjs.com/package/@gpu-tex-enc/etc)
- `tags` - An object containing the tags to use for the plugin. Defaults to `{ nc: "nc" }`.
  - `nc` - The tag used to denote that the image should not be compressed. Can be placed on a folder or file.
