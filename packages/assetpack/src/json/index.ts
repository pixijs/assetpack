import json5 from 'json5';
import { BuildReporter, checkExt, createNewAssetAt } from '../core/index.js';

import type { Asset, AssetPipe } from '../core/index.js';

export function json(): AssetPipe<any, 'nc'> {
    return {
        name: 'json',
        folder: false,
        defaultOptions: null,
        tags: {
            nc: 'nc',
        },
        test(asset: Asset) {
            return !asset.metaData[this.tags!.nc] && checkExt(asset.path, '.json', '.json5');
        },
        async transform(asset: Asset) {
            try {
                const json = json5.parse(asset.buffer.toString());

                // replace the json5 with json
                const filename = asset.filename.replace('.json5', '.json');

                const compressedJsonAsset = createNewAssetAt(asset, filename);

                compressedJsonAsset.buffer = Buffer.from(JSON.stringify(json));

                return [compressedJsonAsset];
            } catch (_e) {
                BuildReporter.error(`[AssetPack][json] Failed to compress json file: ${asset.path}`);

                return [asset];
            }
        },
    };
}
