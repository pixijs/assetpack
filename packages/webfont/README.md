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
    sdfFont: sdfFont(),
    msdfFont: msdfFont(),
  },
};
```

### webfont

This plugin requires the `{wf}` tag to be placed on a folder or file:

```bash
raw-assets
├── game{wf}
│   ├── svgFont.svg
│   └── ttfFont.ttf
└── other
    └── otfFont{wf}.otf
```

### Options

- `tags` - An object containing the tags to use for the plugin. Defaults to `{ font: "wf" }`.

### sdf + msdf

These plugins requires the `{sdf}` or `{msdf}` tag to be placed on a folder or file:

```bash
raw-assets
├── game{sdf}
│   └── sdfFont.ttf
└── other
    └── msdfFont{msdf}.tff
```

These plugins only work with `ttf` files.

### Options

- `tags` - An object containing the tags to use for the plugin. Defaults to `{ font: "wf" }`.
- `font` - An object containing options to customise the font generation.
    - `filename` (String): filename of both font file and font atlas. If omited, font face name is used. **Required** if font is provided as a Buffer.
    - `charset` (String|Array): the characters to include in the bitmap font. Defaults to all ASCII printable characters.
    - `fontSize` (Number): the font size at which to generate the distance field. Defaults to `42`
    - `textureSize` (Array[2]): the dimensions of an output texture sheet, normally power-of-2 for GPU usage. Both dimensions default to `[512, 512]`
    - `texturePadding` (Number): pixels between each glyph in the texture. Defaults to `2`
    - `border` (Number): space between glyphs textures & edge. Defaults to `0`
    - `distanceRange` (Number): the width of the range around the shape between the minimum and maximum representable signed distance in pixels, defaults to `3`
    - `roundDecimal` (Number): rounded digits of the output font metics. For `xml` output, `roundDecimal: 0` recommended.
    - `vector` (Boolean): output a SVG Vector file for debugging. Defauts to `false`
    - `smart-size` (Boolean): shrink atlas to the smallest possible square. Default: `false`
    - `pot` (Boolean): output atlas size shall be power of 2. Default: `false`
    - `square` (Boolean): output atlas size shall be square. Default: `false`
    - `rot` (Boolean): allow 90-degree rotation while packing. Default: `false`
    - `rtl` (Boolean): use RTL(Arabic/Persian) characters fix. Default: `false`

