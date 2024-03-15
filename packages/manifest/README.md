# @assetpack/plugin-manifest

This plugin generates a manifest file so you can easily load your assets in the browser.

Right now it only supports generating a PixiJS manifest file for its `Assets` loader. See [here](https://pixijs.io/guides/basics/assets.html) for more information.

## Installation

```bash
npm install @assetpack/plugin-manifest
```

## Usage

```js
import { pixiManifest } from "@assetpack/plugin-manifest";

export default {
  ...
  plugins: {
    ...
    manifest: pixiManifest(),
  },
};
```

In order to generate new bundle entries in the manifest file, you must use the `{m}` tag on a folder:

```bash

```bash
raw-assets
├── preload{m}
│   └── loader.jpg
└── game{m}
    ├── char.png
    └── pikc.png
```

This will generate two bundles called `preload` and `game` in the manifest file.

## Options

- `output` - The path to the manifest file. Defaults to the output folder defined in your config.
- `createShortcuts` - Whether to create shortcuts for each bundle. Defaults to `false`. If enabled the manifest will try to create the shortest path for an asset. e.g.
```json
{
    "name": ["game/char.png", "game.png"],
    "srcs": ["game/char.png"]
}
```
- `trimExtensions` - Whether to trim the extensions from the asset names. Defaults to `false`. If enabled the manifest will try to create the shortest path for an asset. e.g.
```json
{
    "name": ["game/char.png", "game/char"],
    "srcs": ["game/char.png"]
}
```
- `defaultParser` - The default parser to use on a transformed asset
- `parsers` - An array of manifest parsers to use.
- `tags` - An object containing the tags to use for the plugin. Defaults to `{ m: "m" }`.
  - `m` - The tag to use for generating a bundle entry in the manifest file.
