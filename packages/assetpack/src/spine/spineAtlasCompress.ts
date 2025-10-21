import { checkExt, createNewAssetAt, swapExt } from '../core/index.js';
import { AtlasView } from './AtlasView.js';

import type { Asset, AssetPipe } from '../core/index.js';
import type { CompressOptions } from '../image/index.js';

export type SpineAtlasCompressOptions = Omit<CompressOptions, 'jpg'>;

export type SpineAtlasCompressTags = 'nc';

export function spineAtlasCompress(
    _options?: SpineAtlasCompressOptions,
): AssetPipe<SpineAtlasCompressOptions, SpineAtlasCompressTags> {
    return {
        name: 'spine-atlas-compress',
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
            nc: 'nc',
        },
        test(asset: Asset) {
            return !asset.allMetaData[this.tags!.nc] && checkExt(asset.path, '.atlas');
        },
        async transform(asset: Asset, options) {
            const formats: Array<[format: string, extension: string]> = [];

            if (options.avif) formats.push(['avif', '.avif']);
            if (options.png && options.png !== 'skip') formats.push(['png', '.png']);
            if (options.webp) formats.push(['webp', '.webp']);
            if (options.astc) formats.push(['astc', '.astc.ktx']);
            if (options.bc7) formats.push(['bc7', '.bc7.dds']);
            if (options.basis) formats.push(['basis', '.basis.ktx2']);
            if (options.etc) formats.push(['etc', '.etc.ktx']);

            const atlas = new AtlasView(asset.buffer);

            const textures = atlas.getTextures();

            const assets = formats.map(([format, extension]) => {
                const newAtlas = new AtlasView(asset.buffer);

                const newFileName = swapExt(asset.filename, `.${format}.atlas`);

                textures.forEach((texture) => {
                    newAtlas.replaceTexture(texture, swapExt(texture, extension));
                });

                const newAsset = createNewAssetAt(asset, newFileName);

                newAsset.buffer = newAtlas.buffer;

                return newAsset;
            });

            return assets;
        },
    };
}
