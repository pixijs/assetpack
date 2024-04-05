import type { Asset, AssetPipe, PluginOptions } from '@play-co/assetpack-core';
import { extname, removeExt  } from '@play-co/assetpack-core';
import { readJSON, writeJSON } from 'fs-extra';

export interface TexturePackerCompressOptions extends PluginOptions<'tps'>
{
    formats: string[];
}

export function texturePackerCompress(_options: TexturePackerCompressOptions): AssetPipe<TexturePackerCompressOptions>
{
    const defaultOptions = {
        formats: _options.formats,
        tags: {
            tps: 'tps',
            ..._options?.tags
        }
    };

    return {
        name: 'texture-packer-compress',
        defaultOptions,
        test(asset: Asset, options)
        {
            return (asset.allMetaData[options.tags.tps] && asset.extension === '.json');// && !asset.allMetaData.nc);
        },
        async transform(asset: Asset, options)
        {
            // create a json based on the image
            const json = await readJSON(asset.path);

            // remove dot..
            const imageExtension = extname(json.meta.image).slice(1);

            const imagePath = removeExt(json.meta.image, imageExtension);

            // TODO - just pull from the compression plugin?
            const formats = [...options.formats, imageExtension].join(',');

            json.meta.image = `${imagePath}.{${formats}}`;

            await writeJSON(asset.path, json, { spaces: 2 });

            return [asset];
        },
    };
}
