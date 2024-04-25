import { AssetPack } from '@play-co/assetpack-core';
import { cacheBuster } from '@play-co/assetpack-plugin-cache-buster';
import { readFileSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { spineAtlasCacheBuster } from '../src/spineAtlasCacheBuster';

const pkg = 'spine';

describe('Spine Atlas Cache Buster', () =>
{
    it('should modify the atlas to include the correct file names when cache busting applied', async () =>
    {
        const testName = 'spine-atlas-cache-bust';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'dragon{spine}.atlas',
                        content: assetPath(pkg, 'dragon.atlas'),
                    },
                    {
                        name: 'dragon.png',
                        content: assetPath(pkg, 'dragon.png'),
                    },
                    {
                        name: 'dragon2.png',
                        content: assetPath(pkg, 'dragon2.png'),
                    },
                ],
                folders: [],
            });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [
                cacheBuster(),
                spineAtlasCacheBuster(),
            ]
        });

        await assetpack.run();

        const rawAtlas = readFileSync(`${outputDir}/dragon-qmTByg.atlas`);

        expect(rawAtlas.includes('dragon-iSqGPQ')).toBeTruthy();
        expect(rawAtlas.includes('dragon2-6ebkeA')).toBeTruthy();
    });
});
