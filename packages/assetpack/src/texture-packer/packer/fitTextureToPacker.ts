import type { PackTexturesOptions, PixiPacker } from './packTextures.js';

export function fitTextureToPacker(bin: PixiPacker, { width, height, fixedSize, padding, powerOfTwo }: PackTexturesOptions)
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

        if (powerOfTwo) 
        {
            height = nearestPowerOf2(height);
            width = nearestPowerOf2(width);
        }
    }    

    return { width, height } as { width: number, height: number};
}

function nearestPowerOf2(x: number) {
    if (x <= 1) return 1;
    let power = 1;
    while (power < x) {
        power <<= 1;
    }
    return power;
}
