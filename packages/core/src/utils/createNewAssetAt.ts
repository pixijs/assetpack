import { joinSafe, relative } from 'upath';
import { Asset } from '../Asset';
import { stripTags } from './stripTags';

export function createNewAssetAt(asset: Asset, newFileName: string, outputBase?: string, shouldStripTags?: boolean)
{
    return new Asset({
        path: createNewFilePath(asset, newFileName, outputBase, shouldStripTags),
    });
}

/**
 * Create a new path name to save a file to, based on the namespace and asset
 * it also ensures the directory exists
 * @param namespace - namespace for the asset
 * @param asset - asset to create a path for
 * @param newFileName  - new file name
 * @returns
 */
function createNewFilePath(asset: Asset, newFileName: string, outputBase?: string, shouldStripTags?: boolean)
{
    let original: Asset = asset;

    // get original directory.
    while (original.transformParent)
    {
        original = original.transformParent;
    }

    const originalDir = original.directory;

    const relativePath = relative(original.rootAsset.path, originalDir);

    let outputDir: string;

    if (outputBase)
    {
        outputDir = joinSafe(outputBase, relativePath);
    }
    else
    {
        outputDir = joinSafe('.assetpack', asset.transformName, relativePath);
    }

    if (shouldStripTags)
    {
        // Replace all occurrences of the pattern with an empty string
        outputDir = stripTags(outputDir);
        newFileName = stripTags(newFileName);
    }

    return joinSafe(outputDir, newFileName);
}
