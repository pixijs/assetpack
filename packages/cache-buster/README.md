# @assetpack/plugin-cache-buster

AssetPack plugin for generating hashes and appending them to the file names.
Super useful for when assets change and they need to be re-downloaded.

Note that order matters with AssetPack plugins and its best to have this pipe transform happen at.

When combining this with `texturePacker` you add the `texturePackerCacheBuster` pipe right after
the `cacheBuster` pipe. `texturePackerCacheBuster` will ensure that the json files internanlly update their
asset names to accommodate the new file names.

## Example transform

```
|- assets
  |- mySprite.png
  |- myJson.json
```
transforms to:
```
|- assets
  |- mySprite-dfs3e.png
  |- myJson-aw3dsf.json
```
## Installation

```sh
npm install --save-dev @assetpack/plugin-cache-buster
```

## Basic Usage

```js
import { cacheBuster } from "@assetpack/plugin-cache-buster";

export default {
  ...
  pipes: {
    ...
    cacheBuster(),
  },
};
```

