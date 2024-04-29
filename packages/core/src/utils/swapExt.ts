import { path } from './path';

/**
 * Convenience function that Takes a path and swaps the extension
 * with the new extension provided
 *
 * @param pth - The path to swap the extension of
 * @param newExt - The new extension to use
 * @returns - The path with the new extension
 */
export function swapExt(pth: string, newExt: string)
{
    const pathExt = path.extname(pth);

    return pth.replace(pathExt, newExt);
}
