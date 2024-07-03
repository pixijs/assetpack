import fs from 'fs-extra';
import { createNewAssetAt } from '../utils/createNewAssetAt.js';

import type { Asset } from '../Asset.js';
import type { AssetPipe } from './AssetPipe.js';

export const finalCopyPipe: AssetPipe<object> = {
    name: 'final-copy',
    defaultOptions: {},
    test: (asset: Asset) =>
        !asset.isFolder,
    transform: async (asset: Asset, _options, pipeSystem) =>
    {
        const copiedAsset = createNewAssetAt(asset, asset.filename, pipeSystem.outputPath, true);

        copiedAsset.buffer = asset.buffer;

        fs.ensureDirSync(copiedAsset.directory);
        fs.writeFileSync(copiedAsset.path, copiedAsset.buffer);

        return [copiedAsset];
    }
};
