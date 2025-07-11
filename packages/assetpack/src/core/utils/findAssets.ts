import type { Asset } from '../Asset.js';

export function findAssets(
    test: (asset: Asset) => boolean,
    asset: Asset,
    searchTransform: boolean,
    out: Asset[] = [],
): Asset[] {
    if (test(asset)) {
        out.push(asset);
    }

    for (let i = 0; i < asset.children.length; i++) {
        const child = asset.children[i];

        findAssets(test, child, searchTransform, out);
    }

    for (let i = 0; i < asset.transformChildren.length; i++) {
        const transformChild = asset.transformChildren[i];

        findAssets(test, transformChild, searchTransform, out);
    }

    return out;
}
