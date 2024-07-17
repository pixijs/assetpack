import { checkExt, createNewAssetAt, Logger } from '../core/index.js';

import type { Asset, AssetPipe } from '../core/index.js';

export function json(): AssetPipe<any, 'nc'>
{
    return {
        name: 'json',
        folder: false,
        defaultOptions: null,
        tags: {
            nc: 'nc',
        },
        test(asset: Asset)
        {
            return !asset.metaData[this.tags!.nc] && checkExt(asset.path, '.json');
        },
        async transform(asset: Asset)
        {
            try
            {
                const json = JSON.parse(asset.buffer.toString());
                const compressedJsonAsset = createNewAssetAt(asset, asset.filename);

                compressedJsonAsset.buffer = Buffer.from(JSON.stringify(json));

                return [compressedJsonAsset];
            }
            catch (e)
            {
                Logger.warn(`[AssetPack][json] Failed to compress json file: ${asset.path}`);

                return [asset];
            }
        }
    };
}
