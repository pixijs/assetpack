# @assetpack/plugin-json

AssetPack plugin for minifying JSON files.

## Installation

```sh
npm install --save-dev @assetpack/plugin-json
```

## Usage

```js
import { json } from "@assetpack/plugin-json";

export default {
  ...
  plugins: {
    ...
    json: json(),
  },
};
```
