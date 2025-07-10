import { checkExt, createNewAssetAt, swapExt } from '../core/index.js';

import type { Asset, AssetPipe } from '../core/index.js';
import type { CompressOptions } from '../image/compress.js';

export type TexturePackerCompressOptions = Omit<CompressOptions, 'jpg'>;

export function texturePackerCompress(
    _options?: TexturePackerCompressOptions,
): AssetPipe<TexturePackerCompressOptions, 'tps' | 'nc'> {
    return {
        name: 'texture-packer-compress',
        defaultOptions: {
            ...{
                png: true,
                webp: true,
                avif: false,
                astc: false,
                bc7: false,
                basis: false,
                etc: false,
            },
            ..._options,
        },
        tags: {
            tps: 'tps',
            nc: 'nc',
        },
        test(asset: Asset) {
            return (
                asset.allMetaData[this.tags!.tps] && !asset.allMetaData[this.tags!.nc] && checkExt(asset.path, '.json')
            );
        },
        async transform(asset: Asset, options) {
            const formats: Array<[format: string, extension: string]> = [];

            if (options.avif) formats.push(['avif', '.avif']);
            if (options.png) formats.push(['png', '.png']);
            if (options.webp) formats.push(['webp', '.webp']);
            if (options.astc) formats.push(['astc', '.astc.ktx']);
            if (options.bc7) formats.push(['bc7', '.bc7.dds']);
            if (options.basis) formats.push(['basis', '.basis.ktx2']);
            if (options.etc) formats.push(['etc', '.etc.ktx']);

            const json = JSON.parse(asset.buffer.toString());

            const assets = formats.map(([format, extension]) => {
                const newFileName = swapExt(asset.filename, `.${format}.json`);

                const newAsset = createNewAssetAt(asset, newFileName);
                const newJson = JSON.parse(JSON.stringify(json));

                newJson.meta.image = swapExt(newJson.meta.image, extension);

                if (newJson.meta.related_multi_packs) {
                    // eslint-disable-next-line camelcase
                    newJson.meta.related_multi_packs = (newJson.meta.related_multi_packs as string[]).map((pack) =>
                        swapExt(pack, `.${format}.json`),
                    );
                }

                newAsset.buffer = Buffer.from(JSON.stringify(newJson, null, 2));

                if (!newJson.meta.related_multi_packs) {
                    newAsset.metaData.mIgnore = true;
                }

                return newAsset;
            });

            return assets;
        },
    };
}
