import type { AssetPipe, Asset } from '@play-co/assetpack-core';
import { checkExt, createNewAssetAt, extname } from '@play-co/assetpack-core';
import { fonts } from './fonts';

export function webfont(): AssetPipe
{
    const defaultOptions = {
        tags: {
            wf: 'wf',
        }
    };

    return {
        folder: false,
        name: 'webfont',
        defaultOptions,
        test(asset: Asset, options)
        {
            return asset.metaData[options.tags.wf as any] && checkExt(asset.path, '.otf', '.ttf', '.svg');
        },
        async transform(asset: Asset)
        {
            const ext = extname(asset.path);

            let buffer: Buffer | null = null;

            switch (ext)
            {
                case '.otf':
                    buffer = fonts.otf.to.woff2(asset.path);
                    break;
                case '.ttf':
                    buffer = fonts.ttf.to.woff2(asset.path);
                    break;
                case '.svg':
                    buffer = fonts.svg.to.woff2(asset.path);
                    break;
                default:
                    throw new Error(`{Assetpack] Unsupported font type: ${ext}`);
                    break;
            }

            const newFileName = asset.filename.replace(/\.(otf|ttf|svg)$/i, '.woff2');

            const newAsset = createNewAssetAt(asset, newFileName);

            newAsset.buffer = buffer;

            return [newAsset];
        }
    };
}
