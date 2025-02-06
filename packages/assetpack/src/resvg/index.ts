import { AssetPipe, checkExt, createNewAssetAt, Logger, PluginOptions } from "../core/index.js";
import { Resvg, ResvgRenderOptions } from "@resvg/resvg-js";

export interface ResvgOptions extends PluginOptions {
    resvg?: Partial<ResvgRenderOptions>
}

export function resvg(_options: ResvgOptions = {}): AssetPipe<ResvgOptions, 'nrs'>
{
    return {
        name: "resvg",
        tags: {
            nrs: 'nrs'
        },
        defaultOptions: {
            resvg: {
                fitTo: {
                    mode: "original"
                }
            }
        },
        test(asset, options)
        {
            return !asset.metaData[this.tags!.nrs] && checkExt(asset.path);
        },
        async transform(asset, options)
        {
            const transformedAsset = createNewAssetAt(asset, asset.filename.replace(/\.svg$/, ".png"));
            transformedAsset.buffer = new Resvg(asset.buffer, options.resvg).render().asPng();
            return [transformedAsset];
        },
    }
}
