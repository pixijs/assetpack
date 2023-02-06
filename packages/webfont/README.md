# @assetpack/plugin-webfont

AssetPack plugin for generating woff2 fonts from ttf, otf, woff, and svg files.

## Installation

```sh
npm install --save-dev @assetpack/plugin-webfont
```

## Basic Usage

```js
import { webfont } from "@assetpack/plugin-webfont";

export default {
  ...
  plugins: {
    ...
    webfont: webfont(),
  },
};
```

This plugin requires the `{wf}` tag to be placed on a folder or file:

```bash
raw-assets
├── game{wf}
│   ├── svgFont.svg
│   └── ttfFont.ttf
└── other
    └── otfFont{wf}.otf
```

## Options

- `tags` - An object containing the tags to use for the plugin. Defaults to `{ font: "wf" }`.
