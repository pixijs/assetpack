import { AssetPack } from '@play-co/assetpack-core';
import { texturePackerCacheBuster } from '../src/texturePackerCacheBuster';
import { texturePacker } from '../src/texturePacker';
import { cacheBuster } from '@play-co/assetpack-plugin-cache-buster';
import { readJSONSync } from 'fs-extra';
import type { File } from 'shared/test';
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

describe('Texture Packer Cache Buster', () =>
{
    it('should create a sprite sheet and correctly update json', async () =>
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
                texturePackerCacheBuster()
            ]
        });

        await assetpack.run();

        const sheet1 = readJSONSync(`${outputDir}/sprites-y1nb-g.json`);

        expect(sheet1.meta.image).toEqual('sprites-mG8rgA.png');
    });
});
