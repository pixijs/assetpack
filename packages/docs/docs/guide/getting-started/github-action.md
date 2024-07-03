---
sidebar_position: 4
title: Github Action
---

# Github Action

:::info
You must enable `cache` in your assetpack configuration to use this feature.

See [API Reference](/docs/guide/configuration#cache) for more information.
:::

AssetPack can be used with GitHub Actions to automate the asset optimisation process and cache the result, improving build times. This guide will show you how to set up a GitHub Action to run AssetPack on your repository.

## Setup

To set up a GitHub Action for AssetPack, you need to create a new workflow file in your repository. Create a new file in the `.github/workflows` directory with the following content:

:::note
This example assumes that your raw assets are located in a directory called `raw-assets` and that you have a `build` script in your `package.json` file that runs AssetPack.

You may need to adjust the paths and commands to match your project structure.
:::

```yaml
name: AssetPack

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    # Cache assets!
    - name: Generate hash from file names
        id: hash-names
        run: echo "NAMES_HASH=$(find ./raw-assets -type f | sort | md5sum | cut -d' ' -f1)" >> $GITHUB_ENV

    - name: Cache .assetpack directory
        id: cache-directory
        uses: actions/cache@v4
        with:
        path: |
            .assetpack
            raw-assets
        key: ${{ runner.os }}-cache-23-04-24-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('raw-assets/**/*') }}-${{ env.NAMES_HASH }}
        restore-keys: |
            ${{ runner.os }}-cache-23-04-24-${{ hashFiles('**/package-lock.json') }}
    # End Cache assets!

    # Now do your build
    - name: Build
      run: npm run build
```


