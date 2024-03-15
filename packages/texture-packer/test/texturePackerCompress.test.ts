import { AssetPack } from '@assetpack/core';
import { compress } from '@assetpack/plugin-compress';
import { texturePacker, texturePackerCompress } from '@assetpack/plugin-texture-packer';
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
    it('should create a sprite sheet', async () =>
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
                compress(),
                texturePackerCompress({
                    formats: ['webp', 'avif'],
                }),
            ]
        });

        await assetpack.run();

        const sheet1 = readJSONSync(`${outputDir}/sprites@1x.json`);

        expect(sheet1.meta.image).toEqual(`sprites@1x.{webp,avif,png}`);
    });
});
