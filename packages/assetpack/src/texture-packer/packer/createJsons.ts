import { path } from '../../core/index.js';
import { createName } from './createTextures.js';

import type { PixiPacker } from './packTextures.js';

function convertName(pth: string, nameStyle: 'short' | 'relative', removeFileExtension = false)
{
    const name = nameStyle === 'short' ? path.basename(pth) : pth;

    return removeFileExtension ? path.parse(name).name : name;
}

export function createJsons(
    packer: PixiPacker,
    width: number,
    height: number,
    options: {
        textureName: string;
        resolution: number;
        textureFormat: 'png' | 'jpg';
        nameStyle: 'short' | 'relative';
        removeFileExtension: boolean;
    },
)
{
    const bins = packer.bins;

    const jsons = [];

    for (let i = 0; i < bins.length; i++)
    {
        const bin = bins[i];

        const json: any = {
            frames: {},
        };

        for (let j = 0; j < bin.rects.length; j++)
        {
            const rect = bin.rects[j] as any;

            json.frames[convertName(rect.path, options.nameStyle, options.removeFileExtension)] = {
                frame: {
                    x: rect.x,
                    y: rect.y,
                    w: rect.width,
                    h: rect.height,
                },
                rotated: rect.rot,
                trimmed: rect.textureData.trimmed,
                spriteSourceSize: {
                    x: rect.textureData.trimOffsetLeft,
                    y: rect.textureData.trimOffsetTop,
                    w: rect.width,
                    h: rect.height,
                },
                sourceSize: {
                    w: rect.textureData.originalWidth,
                    h: rect.textureData.originalHeight,
                },
            };
        }

        json.meta = {
            app: 'http://github.com/pixijs/assetpack',
            version: '1.0',
            image: createName(options.textureName, i, bins.length !== 1, options.resolution, options.textureFormat),
            format: 'RGBA8888',
            size: {
                w: width,
                h: height,
            },
            scale: options.resolution,
            related_multi_packs: null,
        };

        jsons.push({
            name: createName(options.textureName, i, bins.length !== 1, options.resolution, 'json'),
            json,
        });
    }

    // before we leave, lets connect all the jsons to the first json..

    const firstJsonMeta = jsons[0].json.meta;

    firstJsonMeta.related_multi_packs = [];

    for (let i = 1; i < jsons.length; i++)
    {
        firstJsonMeta.related_multi_packs.push(jsons[i].name);
    }

    return jsons;
}
