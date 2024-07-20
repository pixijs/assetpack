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
        exporter?: 'Phaser3' | 'Pixi';
    },
)
{
    const bins = packer.bins;

    const jsons = [];

    for (let i = 0; i < bins.length; i++)
    {
        const bin = bins[i];

        const json: any = {};

        if (options.exporter === "Pixi") {
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
            json.frames = {};

            for (let j = 0; j < bin.rects.length; j++)
            {
                const rect = bin.rects[j] as any;

                json.frames[convertName(rect.path, options.nameStyle, options.removeFileExtension)] = {
                    filename: convertName(rect.path, options.nameStyle, options.removeFileExtension),
                    rotated: rect.rot,
                    trimmed: rect.textureData.trimmed,
                    sourceSize: {
                        w: rect.textureData.originalWidth,
                        h: rect.textureData.originalHeight,
                    },
                    spriteSourceSize: {
                        x: rect.textureData.trimOffsetLeft,
                        y: rect.textureData.trimOffsetTop,
                        w: rect.width,
                        h: rect.height,
                    },
                    frame: {
                        x: rect.x,
                        y: rect.y,
                        w: rect.width,
                        h: rect.height,
                    },
                };
            }
        } else if (options.exporter === "Phaser3") {
            json.meta = {
                app: 'http://github.com/pixijs/assetpack',
                version: '1.0'
            };

            json.textures = [
                {
                    image: createName(options.textureName, i, bins.length !== 1, options.resolution, options.textureFormat),
                    format: 'RGBA8888',
                    size: {
                        w: width,
                        h: height,
                    },
                    scale: options.resolution,
                    frames: [],
                }
            ];

            for (let j = 0; j < bin.rects.length; j++) {
                const rect = bin.rects[j];
                json.textures[0].frames.push( {
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
                });
            }
        }

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
