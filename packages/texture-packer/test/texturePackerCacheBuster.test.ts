import { AssetPack } from '@play-co/assetpack-core';
import { cacheBuster } from '@play-co/assetpack-plugin-cache-buster';
import { mipmapCompress } from '@play-co/assetpack-plugin-mipmap-compress';
import { texturePacker, texturePackerCompress } from '@play-co/assetpack-plugin-texture-packer';
import { existsSync, readJSONSync } from 'fs-extra';
import type { File } from '../../../shared/test/index';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test/index';
import { texturePackerCacheBuster } from '../src/texturePackerCacheBuster';

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
    it('should create a correct file names when cache busting applied', async () =>
    {
        const testName = 'tp-cache-bust';
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
                cacheBuster(),
                texturePackerCacheBuster(),
            ]
        });

        await assetpack.run();

        const sheetJson = readJSONSync(`${outputDir}/sprites-uldFYw.json`);

        expect(existsSync(`${outputDir}/sprites-mG8rgA.png`)).toBeTruthy();

        expect(sheetJson.meta.image).toEqual(`sprites-mG8rgA.png`);
    });

    it('should create correct cache busting with all compressed sprite sheets', async () =>
    {
        const testName = 'tp-compression-cache-bust';
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
                cacheBuster(),
                texturePackerCacheBuster(),
            ]
        });

        await assetpack.run();

        const sheetPng = readJSONSync(`${outputDir}/sprites.png-iBkW2A.json`);
        const sheetWebp = readJSONSync(`${outputDir}/sprites.webp-odbOfA.json`);

        expect(sheetPng.meta.image).toEqual(`sprites-5vMQDw.png`);
        expect(sheetWebp.meta.image).toEqual(`sprites-ygsGhQ.webp`);
    });
});
