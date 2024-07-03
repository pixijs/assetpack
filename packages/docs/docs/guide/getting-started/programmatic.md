---
sidebar_position: 2
title: Programmatic
---

# Programmatic

AssetPack can be run programmatically, allowing you to run AssetPack from your own scripts.

To see a full list of configuration options, see the [API Reference](/docs/guide/configuration).

## Usage

To use AssetPack programmatically, you need to import the `assetpack` function from the `assetpack` package, and call it with the following options:

```js
import { AssetPack } from 'assetpack';

const assetpack = new AssetPack({
    entry: './raw-assets',
    output: './public/assets',
    pipes: [],
});

// To run AssetPack
await assetpack.run();
// Or to watch the assets directory for changes
void assetpack.watch();
// To stop watching the assets directory
assetpack.stop();
```
