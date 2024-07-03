import { createJsons } from './createJsons.js';
import { createTextureData } from './createTextureData.js';
import { createTextures } from './createTextures.js';
import { fitTextureToPacker } from './fitTextureToPacker.js';

import type { MaxRectsPacker, Rectangle } from 'maxrects-packer';

export interface PixiRectData extends Rectangle
{
    textureData: TextureData;
    path: string;
}

export type PixiPacker = MaxRectsPacker<PixiRectData>;

export type TexturePackerFormat = 'png' | 'jpg';

export interface TextureData
{
    buffer: Buffer;
    originalWidth: number;
    originalHeight: number;
    width: number;
    height: number;
    trimOffsetLeft: number;
    trimOffsetTop: number;
    path: string;
    trimmed: boolean;
}

export interface PackTexturesOptions
{
    texturesToPack: {path: string, contents: Buffer}[];
    textureName: string;
    padding?: number;
    fixedSize?: boolean;
    powerOfTwo?: boolean;
    width?: number;
    height?: number;
    allowTrim?: boolean;
    allowRotation?: boolean
    alphaThreshold?: number;
    textureFormat?: TexturePackerFormat;
    scale?: number;
    resolution?: number;
    nameStyle?: 'short' | 'relative';
    removeFileExtension?: boolean;
    // prependFolderName
}

interface PackTexturesResult
{
    textures: {name: string, buffer: Buffer}[];
    jsons: {name: string, json: any}[];
}

export async function packTextures(
    _options: PackTexturesOptions
): Promise<PackTexturesResult>
{
    const options: Required<PackTexturesOptions> = {
        width: 1024,
        height: 1024,
        padding: 2,
        fixedSize: false,
        powerOfTwo: false,
        allowTrim: true,
        allowRotation: true,
        alphaThreshold: 0.1,
        textureFormat: 'png',
        scale: 1,
        resolution: 1,
        nameStyle: 'relative',
        removeFileExtension: false,
        ..._options,
    };

    options.width *= options.scale;
    options.height *= options.scale;

    // this reads all the textures, trims them and resize them.
    // next it creates a MaxRectsPacker, packs the textures, and returns the MaxRectsPacker
    // which now contains all the info we need to create the textures and jsons
    const packer = await createTextureData(options);

    const { width, height } = fitTextureToPacker(packer, options);

    return {
        // combine the textures into one big one with all the info we have
        textures: await createTextures(packer, width, height, options),
        // create the jsons for the textures
        jsons: createJsons(packer, width, height, options)
    };
}

