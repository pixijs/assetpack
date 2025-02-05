import { json2xml, xml2json } from 'xml-js';
import { checkExt, createNewAssetAt, path, swapExt } from '../core/index.js';

import type { Asset, AssetPipe } from '../core/index.js';
import type { CompressOptions } from '../image/compress.js';
import type { jsonType, pageType } from './sdf.js';

export type SDFCompressOptions = Omit<CompressOptions, 'jpg'>;

export function sdfCompress(
    _options?: SDFCompressOptions,
): AssetPipe<SDFCompressOptions, 'font' | 'nc'>
{
    return {
        name: 'sdf-compress',
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
            font: 'font',
            nc: 'nc',
        },
        test(asset: Asset)
        {
            return (
                !asset.allMetaData[this.tags!.nc]
                && checkExt(asset.path, '.fnt', '.xml')
            );
        },
        async transform(asset: Asset, options)
        {
            const formats: Array<[format: string, extension: string]> = [];

            if (options.avif) formats.push(['avif', '.avif']);
            if (options.png) formats.push(['png', '.png']);
            if (options.webp) formats.push(['webp', '.webp']);
            if (options.astc) formats.push(['astc', '.astc.ktx']);
            if (options.bc7) formats.push(['bc7', '.bc7.dds']);
            if (options.basis) formats.push(['basis', '.basis.ktx2']);
            if (options.etc) formats.push(['etc', '.etc.ktx']);

            const str = asset.buffer.toString()
                .replaceAll('&', '&amp;');
            const fntJsonStr = xml2json(str, { compact: true });

            const json: jsonType = JSON.parse(fntJsonStr);
            const extname = path.extname(asset.filename);

            const assets = formats.map(([format, extension]) =>
            {
                const newFileName = swapExt(asset.filename, `.${format}${extname}`);

                const newAsset = createNewAssetAt(asset, newFileName);
                const newJson: jsonType = JSON.parse(JSON.stringify(json));

                let pageArr: pageType[];

                if (Array.isArray(newJson.font.pages.page))
                {
                    pageArr = newJson.font.pages.page;
                }
                else
                {
                    pageArr = [newJson.font.pages.page];
                }

                pageArr.forEach((page) =>
                {
                    page._attributes.file = swapExt(page._attributes.file, `${extension}`);
                });

                newAsset.buffer = Buffer.from(json2xml(JSON.stringify(newJson), {
                    compact: true,
                    spaces: 4,
                }));
                // newJson.meta.image = swapExt(newJson.meta.image, extension);
                //
                // if (newJson.meta.related_multi_packs)
                // {
                //     newJson.meta.related_multi_packs = (newJson.meta.related_multi_packs as string[]).map((pack) =>
                //         swapExt(pack, `.${format}.json`),
                //     );
                // }
                //
                // newAsset.buffer = Buffer.from(JSON.stringify(newJson, null, 2));
                //
                // if (!newJson.meta.related_multi_packs)
                // {
                //     newAsset.metaData.mIgnore = true;
                // }

                return newAsset;
            });

            return assets;
        },
    };
}
