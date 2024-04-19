import type { AssetPipe, Asset, PluginOptions } from '@play-co/assetpack-core';
import { checkExt, createNewAssetAt, Logger } from '@play-co/assetpack-core';

export type JsonOptions = PluginOptions<'nc'>;

export function json(_options: JsonOptions = {}): AssetPipe
{
    const defaultOptions = {
        tags: {
            nc: 'nc',
            ..._options?.tags
        }

    };

    return {
        name: 'json',
        folder: false,
        defaultOptions,
        test(asset: Asset, options)
        {
            return !asset.metaData[options.tags.nc] && checkExt(asset.path, '.json');
        },
        async transform(asset: Asset)
        {
            try
            {
                let json = JSON.parse(asset.buffer.toString());

                json = JSON.stringify(json);

                const compressedJsonAsset = createNewAssetAt(asset, asset.filename);

                compressedJsonAsset.buffer = Buffer.from(JSON.stringify(json, null, 2));

                return [compressedJsonAsset];
            }
            catch (e)
            {
                Logger.warn(`[json] Failed to compress json file: ${asset.path}`);

                return [asset];
            }
        }
    };
}
