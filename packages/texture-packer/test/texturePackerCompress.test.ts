import { AssetPack } from '@play-co/assetpack-core';
import { mipmapCompress } from '@play-co/assetpack-plugin-mipmap-compress';
import { texturePacker, texturePackerCompress } from '@play-co/assetpack-plugin-texture-packer';
import { readJSONSync } from 'fs-extra';
import type { File } from '../../../shared/test/index';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test/index';

const pkg = 'texture-packer';

function genFolder(testName: string)
{
    const sprites: File[] = [];

    for (let i = 0; i < 10; i++)
    {
        sprites.push({
            name: `sprite${i}.png`,
            content: assetPath(pkg, `sp-${i + 1}.png`),
        });
    }
    createFolder(
        pkg,
        {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'sprites{tps}',
                    files: sprites,
                    folders: [],
                },
            ],
        });
}

describe('Texture Packer Compression', () =>
{
    it.skip('should create a sprite sheet', async () =>
    {
        const testName = 'tp-compression';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        genFolder(testName);

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1 },
                    },
                }),
                mipmapCompress({
                    compress: {
                        png: true,
                        jpg: true,
                        webp: true,
                    }
                }),
                texturePackerCompress(),
            ]
        });

        await assetpack.run();

        const sheetPng = readJSONSync(`${outputDir}/sprites.png.json`);
        const sheetWebp = readJSONSync(`${outputDir}/sprites.webp.json`);

        expect(sheetPng.meta.image).toEqual(`sprites.png`);
        expect(sheetWebp.meta.image).toEqual(`sprites.webp`);
    });
});
