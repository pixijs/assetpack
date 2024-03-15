import { extname } from 'upath';

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

    const pathExtname = extname(path).toLowerCase();

    return ext.some((e) => e.toLowerCase() === pathExtname);
}
