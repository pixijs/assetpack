import { path } from './path.js';

export function checkExt(pth: string, ...ext: string[])
{
    if (typeof pth !== 'string')
    {
        return false;
    }

    if (pth.length === 0)
    {
        return false;
    }

    if (ext.length === 0)
    {
        return true;
    }

    const pathExtname = path.extname(pth).toLowerCase();

    return ext.some((e) => e.toLowerCase() === pathExtname);
}
