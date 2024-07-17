import { glob } from 'glob';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cacheBuster } from '../../src/cache-buster/index.js';
import { AssetPack } from '../../src/core/index.js';
import { spineAtlasCacheBuster } from '../../src/spine/spineAtlasCacheBuster.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

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
                        content: assetPath('spine/dragon.atlas'),
                    },
                    {
                        name: 'dragon.png',
                        content: assetPath('spine/dragon.png'),
                    },
                    {
                        name: 'dragon2.png',
                        content: assetPath('spine/dragon2.png'),
                    },
                ],
                folders: [],
            });

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                cacheBuster(),
                spineAtlasCacheBuster(),
            ]
        });

        await assetpack.run();

        const globPath = `${outputDir}/*.{atlas,png}`;
        const files = await glob(globPath);

        // need two sets of files
        expect(files.length).toBe(3);
        expect(files.filter((file) => file.endsWith('.atlas')).length).toBe(1);
        expect(files.filter((file) => file.endsWith('.png')).length).toBe(2);

        const atlasFiles = files.filter((file) => file.endsWith('.atlas'));
        const pngFiles = files.filter((file) => file.endsWith('.png'));

        // check that the files are correct
        atlasFiles.forEach((atlasFile) =>
        {
            const rawAtlas = readFileSync(atlasFile);

            const checkFiles = (fileList: string[]) =>
            {
                fileList.forEach((file) =>
                {
                    // remove the outputDir
                    file = file.replace(`${outputDir}/`, '');

                    expect(rawAtlas.includes(file)).toBe(true);
                });
            };

            checkFiles(pngFiles);
        });
    });
});
