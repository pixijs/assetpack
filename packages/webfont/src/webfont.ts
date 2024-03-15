import type { AssetPipe, Asset } from '@assetpack/core';
import { checkExt, createNewAssetAt, extname } from '@assetpack/core';
import { fonts } from './fonts';
import { writeFile } from 'fs-extra';

export function webfont(): AssetPipe
{
    return {
        folder: false,
        name: 'webfont',
        test(asset: Asset)
        {
            return checkExt(asset.path, '.otf', '.ttf', '.svg');
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
            }

            const newFileName = asset.filename.replace(/\.(otf|ttf|svg)$/i, '.woff2');

            const newAsset = createNewAssetAt(asset, newFileName);

            await writeFile(newAsset.path, buffer as Buffer);

            return [newAsset];
        }
    };
}
