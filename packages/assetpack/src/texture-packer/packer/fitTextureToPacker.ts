import type { PackTexturesOptions, PixiPacker } from './packTextures.js';

export function fitTextureToPacker(bin: PixiPacker, { width, height, fixedSize, padding }: PackTexturesOptions)
{
    if (!fixedSize)
    {
        width = 0;
        height = 0;

        for (let j = 0; j < bin.rects.length; j++)
        {
            const rect = bin.rects[j];

            if (rect.rot)
            {
                width = Math.max(width, rect.x + rect.height);
                height = Math.max(height, rect.y + rect.width);
            }

            else
            {
                width = Math.max(width, rect.x + rect.width);
                height = Math.max(height, rect.y + rect.height);
            }
        }

        height += padding ?? 0;
        width += padding ?? 0;
    }

    return { width, height } as { width: number, height: number};
}
