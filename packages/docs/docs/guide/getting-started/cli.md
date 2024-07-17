---
sidebar_position: 2
title: CLI
---

# CLI

The AssetPack CLI is a command line interface that allows you to run AssetPack from the command line.

## Usage

To use the AssetPack CLI, you need call the `assetpack` command with the following options:

```json
{
    "scripts": {
        "prebuild": "assetpack",
        "build": "your-build-command",
        "watch:assetpack": "assetpack -w",
        "watch": "npm run watch:assetpack & your-watch-command"
    }
}
```

This will run AssetPack before your build command, and will optimise your assets before they are built.

## Configuration

- `-c`: The location of the config file to use. Defaults to `.assetpack.js`. To see a full list of configuration options, see the [API Reference](/docs/guide/configuration).
- `-w`: Watch the assets directory for changes and re-run AssetPack when changes are detected.
