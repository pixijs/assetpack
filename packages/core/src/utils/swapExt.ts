import { extname } from 'upath';

/**
 * Convenience function that Takes a path and swaps the extension
 * with the new extension provided
 *
 * @param path - The path to swap the extension of
 * @param newExt - The new extension to use
 * @returns - The path with the new extension
 */
export function swapExt(path: string, newExt: string)
{
    const pathExt = extname(path);

    return path.replace(pathExt, newExt);
}
