import type { AssetPipe, Asset, PluginOptions } from '@play-co/assetpack-core';
import { checkExt, createNewAssetAt } from '@play-co/assetpack-core';
import { readJson, writeJSON } from 'fs-extra';

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
                let json = await readJson(asset.path);

                json = JSON.stringify(json);

                const compressedJsonAsset = createNewAssetAt(asset, asset.filename);

                await writeJSON(compressedJsonAsset.path, json);

                return [compressedJsonAsset];
            }
            catch (e)
            {
                // Logger.warn(`[json] Failed to parse json file: ${asset.path}`);
                return [asset];
            }
        }
    };
}
