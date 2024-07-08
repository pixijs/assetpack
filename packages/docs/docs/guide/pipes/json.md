---
sidebar_position: 3
---

# JSON

AssetPack plugin for minifying JSON files. This plugin simplifies JSON files by removing whitespace, reducing file size and improving load times.

## Example

```js
import { json } from "@assetpack/core";

export default {
  ...
  pipes: {
    ...
    json(),
  },
};
```
