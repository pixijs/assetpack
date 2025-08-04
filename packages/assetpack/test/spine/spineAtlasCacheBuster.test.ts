import { readFileSync } from 'fs-extra';
import { glob } from 'glob';
import { describe, expect, it } from 'vitest';
import { cacheBuster } from '../../src/cache-buster/index.js';
import { AssetPack } from '../../src/core/index.js';
import { spineAtlasCacheBuster } from '../../src/spine/spineAtlasCacheBuster.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

import type { File } from '../utils/index.js';
import path from 'path';

const pkg = 'spine';

describe('Spine Atlas Cache Buster', () => {
    it('should modify the atlas to include the correct file names when cache busting applied', async () => {
        const testName = 'spine-atlas-cache-bust';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
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
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [cacheBuster(), spineAtlasCacheBuster()],
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
        atlasFiles.forEach((atlasFile) => {
            const rawAtlas = readFileSync(atlasFile);

            const checkFiles = (fileList: string[]) => {
                fileList.forEach((file) => {
                    // remove the outputDir
                    file = file.replace(`${outputDir}/`, '');

                    expect(rawAtlas.includes(file)).toBe(true);
                });
            };

            checkFiles(pngFiles);
        });
    });

    it('should create same name atlases in different directories and correctly update paths to atlas assets', async () => {
        const testName = 'spine-cache-bust-samename';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        const spineFiles = ['main.atlas', 'skeleton.json', 'main.png']

        const spineSmall: File[]  = spineFiles.map(file => ({
            name: file,
            content: assetPath(`spine/small-square/${file}`)
        }))

        const spineLarge: File[] = spineFiles.map(file => ({
            name: `${file}`,
            content: assetPath(`spine/large-square/${file}`)
        }))

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'small',
                    files: [],
                    folders: [
                        {
                            name: 'spine',
                            files: spineSmall,
                            folders: [],
                        },
                    ],
                },
                {
                    name: 'large',
                    files: [],
                    folders: [
                        {
                            name: 'spine',
                            files: spineLarge,
                            folders: [],
                        },
                    ],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                cacheBuster(),
                spineAtlasCacheBuster()
            ],
        });

        await assetpack.run();

        const smallPath = path.join(outputDir, 'small/spine', `*.{atlas,json,png}`).replaceAll('\\', '/');
        const smallFiles = await glob(smallPath);

        expect(smallFiles.length).toBe(3);
        expect(smallFiles.filter((file) => file.endsWith('.json')).length).toBe(1);
        expect(smallFiles.filter((file) => file.endsWith('.atlas')).length).toBe(1);
        expect(smallFiles.filter((file) => file.endsWith('.png')).length).toBe(1);

        checkSpineAtlasAssetPath(smallFiles)

        const largePath = path.join(outputDir, 'large/spine', `*.{atlas,json,png}`).replaceAll('\\', '/');
        const largeFiles = await glob(largePath);

        expect(largeFiles.length).toBe(3);
        expect(largeFiles.filter((file) => file.endsWith('.json')).length).toBe(1);
        expect(largeFiles.filter((file) => file.endsWith('.atlas')).length).toBe(1);
        expect(largeFiles.filter((file) => file.endsWith('.png')).length).toBe(1);

        checkSpineAtlasAssetPath(largeFiles)
    });
});

function checkSpineAtlasAssetPath(files: string[]) {
    const pngPath = files.find(file => file.endsWith('.png'))

    if (!pngPath) throw new Error('Could not find png file')

    const pngFilename = path.basename(pngPath)

    const atlasPath = files.find(file => file.endsWith('.atlas'))

    if (!atlasPath) throw new Error('Could not find atlas file')

    const atlasContent = readFileSync(atlasPath, 'utf-8').split('\n')

    expect(atlasContent[0]).toBe(pngFilename)
}