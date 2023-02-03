import upath from 'upath';
import internalMerge from 'merge';
import type { RootTree, TransformedTree } from './AssetPack';

/**
 * A function that checks if the tree has the tags.
 * @param tree - The tree to be checked.
 * @param type - Whether to search the for local or global tags on the path
 * @param tags - The tags to be checked.
 * @returns If the tree has the tags.
 */
export function hasTag(tree: RootTree | TransformedTree, type: 'file' | 'path', ...tags: string[]): boolean
{
    if (type === 'file')
    {
        return tags.some((tag) => !!tree.fileTags[tag]);
    }

    return tags.some((tag) => !!tree.fileTags[tag] || !!(tree.pathTags?.[tag]));
}

export function replaceExt(path: string, ext: string)
{
    if (typeof path !== 'string')
    {
        return path;
    }

    if (path.length === 0)
    {
        return path;
    }

    const nFileName = upath.basename(path, upath.extname(path)) + ext;
    const nFilepath = upath.joinSafe(upath.dirname(path), nFileName);

    // Because `path.join` removes the head './' from the given path.
    // This removal can cause a problem when passing the result to `require` or
    // `import`.
    if (startsWithSingleDot(path) && !startsWithSingleDot(nFilepath))
    {
        return `./${nFilepath}`;
    }

    return nFilepath;
}

export function checkExt(path: string, ...ext: string[])
{
    if (typeof path !== 'string')
    {
        return false;
    }

    if (path.length === 0)
    {
        return false;
    }

    if (ext.length === 0)
    {
        return true;
    }

    const extname = upath.extname(path).toLowerCase();

    return ext.some((e) => e.toLowerCase() === extname);
}

function startsWithSingleDot(path: string)
{
    const first2chars = path.slice(0, 2);

    return first2chars === './';
}

export const path = upath;
export const merge = internalMerge;
