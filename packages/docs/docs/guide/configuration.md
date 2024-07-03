---
sidebar_position: 0
---

# API Reference

AssetPack uses a config file to define what assets you want to optimise and how you want to optimise them. The config file is a JavaScript file that exports an object with the following properties:

### entry

| Type     | Default | Required |
| -------- | ------- | -------- |
| `string` |         | Yes      |

The directory where your raw assets are located.

### output

| Type     | Default | Required |
| -------- | ------- | -------- |
| `string` |         | Yes      |

The directory where you want your optimised assets to be outputted to.

### ignore

| Type       | Default | Required |
| ---------- | ------- | -------- |
| `string[]` |         | No       |

An optional array of ignore patterns. Any file path matching the patterns will not be processed by assetpack.

### cache

| Type      | Default | Required |
| --------- | ------- | -------- |
| `boolean` | `true`  | No       |

An optional boolean to enable or disable caching.

### cacheLocation

| Type     | Default        | Required |
| -------- | -------------- | -------- |
| `string` | `'.assetpack'` | No       |

An optional string to set the location of the cache.

### logLevel

| Type     | Default  | Required |
| -------- | -------- | -------- |
| `string` | `'info'` | No       |

An optional string to set the log level.

### pipes

| Type     | Default | Required |
| -------- | ------- | -------- |
| `Pipe[]` |         | No       |

An array of pipes to use. For examples of pipes, see [Pipes](/docs/guide/pipes/overview#concepts).

### assetSettings

| Type             | Default | Required |
| ---------------- | ------- | -------- |
| `AssetSetting[]` |         | No       |

| Property | Type     | Default | Required |
| -------- | -------- | ------- | -------- |
| files    | `string` |         | Yes      |
| settings | `object` |         | No       |
| metaData | `object` |         | No       |

An optional array of asset settings. This allows you to set specific settings for individual assets.

#### Example

```js
// .assetpack.js

export default {
    entry: './raw-assets',
    output: './public',
    ignore: ['**/*.html'],
    cache: true,
    cacheLocation: '.assetpack',
    logLevel: 'info',
    pipes: [
        // Pipes go here
    ],
    assetSettings: [
        {
            files: ['**/*.png'],
            settings: {
                compress: {
                    jpg: true,
                    png: true,
                    // all png files will be compressed to avif format but not webp
                    webp: false,
                    avif: true,
                },
            },
        },
    ],
};
```
