import { ensureDirSync, writeFileSync } from 'fs-extra';
import type { Asset } from '../Asset';
import { createNewAssetAt } from '../utils/createNewAssetAt';
import type { AssetPipe } from './AssetPipe';

export const finalCopyPipe: AssetPipe<object> = {
    name: 'final-copy',
    defaultOptions: {},
    test: (asset: Asset) =>
        !asset.isFolder,
    transform: async (asset: Asset, _options, pipeSystem) =>
    {
        const copiedAsset = createNewAssetAt(asset, asset.filename, pipeSystem.outputPath, true);

        copiedAsset.buffer = asset.buffer;

        ensureDirSync(copiedAsset.directory);
        writeFileSync(copiedAsset.path, copiedAsset.buffer);

        return [copiedAsset];
    }
};
