import { glob } from 'glob';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cacheBuster } from '../../src/cache-buster/index.js';
import { AssetPack } from '../../src/core/index.js';
import { compress, mipmap } from '../../src/image/index.js';
import { spineAtlasCacheBuster } from '../../src/spine/spineAtlasCacheBuster.js';
import { spineAtlasCompress } from '../../src/spine/spineAtlasCompress.js';
import { spineAtlasMipmap } from '../../src/spine/spineAtlasMipmap.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'spine';

describe('Spine Atlas All', () => {
    it('should correctly create files when Mipmap and Compress are used', async () => {
        const testName = 'spine-atlas-compress-mip';
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
            pipes: [
                compress({
                    png: true,
                    webp: true,
                    jpg: true,
                    astc: true,
                }),
                mipmap({
                    resolutions: { default: 1, low: 0.5 },
                }),
                spineAtlasMipmap({
                    resolutions: { default: 1, low: 0.5 },
                }),
                spineAtlasCompress({
                    png: true,
                    webp: true,
                    astc: true,
                }),
            ],
        });

        await assetpack.run();

        const rawAtlasWebpHalf = readFileSync(`${outputDir}/dragon@0.5x.webp.atlas`);
        const rawAtlasAstcHalf = readFileSync(`${outputDir}/dragon@0.5x.astc.atlas`);
        const rawAtlasHalf = readFileSync(`${outputDir}/dragon@0.5x.png.atlas`);

        expect(rawAtlasHalf.includes('dragon@0.5x.png')).toBeTruthy();
        expect(rawAtlasHalf.includes('dragon2@0.5x.png')).toBeTruthy();

        expect(rawAtlasWebpHalf.includes('dragon@0.5x.webp')).toBeTruthy();
        expect(rawAtlasWebpHalf.includes('dragon2@0.5x.webp')).toBeTruthy();

        expect(rawAtlasAstcHalf.includes('dragon@0.5x.astc.ktx')).toBeTruthy();
        expect(rawAtlasAstcHalf.includes('dragon2@0.5x.astc.ktx')).toBeTruthy();
    });

    it('should correctly create files when Mipmap and CacheBuster are used', async () => {
        const testName = 'spine-atlas-mip-cache-buster';
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
            pipes: [
                mipmap({
                    resolutions: { default: 1, low: 0.5 },
                }),
                compress({
                    png: true,
                    webp: true,
                    jpg: true,
                    astc: true,
                }),
                spineAtlasMipmap({
                    resolutions: { default: 1, low: 0.5 },
                }),
                spineAtlasCompress({
                    png: true,
                    webp: true,
                    astc: true,
                }),
                cacheBuster(),
                spineAtlasCacheBuster(),
            ],
        });

        await assetpack.run();
        const globPath = `${outputDir}/*.{atlas,png,webp,astc.ktx}`;
        const files = await glob(globPath);

        // need two sets of files
        expect(files.length).toBe(18);
        expect(files.filter((file) => file.endsWith('.atlas')).length).toBe(6);
        expect(files.filter((file) => file.endsWith('.png')).length).toBe(4);
        expect(files.filter((file) => file.endsWith('.webp')).length).toBe(4);
        expect(files.filter((file) => file.endsWith('.astc.ktx')).length).toBe(4);
        expect(files.filter((file) => file.endsWith('.jpg')).length).toBe(0);

        const atlasFiles = files.filter((file) => file.endsWith('.atlas'));
        const pngFiles = files.filter((file) => file.endsWith('.png'));
        const webpFiles = files.filter((file) => file.endsWith('.webp'));
        const astcFiles = files.filter((file) => file.endsWith('.astc.ktx'));

        // check that the files are correct
        atlasFiles.forEach((atlasFile) => {
            const rawAtlas = readFileSync(atlasFile);
            const isHalfSize = atlasFile.includes('@0.5x');
            const isWebp = atlasFile.includes('.webp');
            const isPng = atlasFile.includes('.png');
            const isAstc = atlasFile.includes('.astc');

            const checkFiles = (fileList: string[], isHalfSize: boolean, isFileType: boolean) => {
                fileList.forEach((file) => {
                    // remove the outputDir
                    file = file.replace(`${outputDir}/`, '');
                    const isFileHalfSize = file.includes('@0.5x');
                    // eslint-disable-next-line no-nested-ternary
                    const isFileFileType = file.includes(isWebp ? '.webp' : isAstc ? '.astc' : '.png');
                    const shouldExist = isHalfSize === isFileHalfSize && isFileType === isFileFileType;

                    expect(rawAtlas.includes(file)).toBe(shouldExist);
                });
            };

            if (isHalfSize) {
                if (isWebp) {
                    checkFiles(webpFiles, true, true);
                } else if (isPng) {
                    checkFiles(pngFiles, true, true);
                } else if (isAstc) {
                    checkFiles(astcFiles, true, true);
                }
            } else if (isWebp) {
                checkFiles(webpFiles, false, true);
            } else if (isPng) {
                checkFiles(pngFiles, false, true);
            } else if (isAstc) {
                checkFiles(astcFiles, false, true);
            }
        });
    });

    it('should excluded png files when omit is passed', async () => {
        const testName = 'spine-atlas-mip-omit1';
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
            pipes: [
                mipmap({
                    resolutions: { default: 1, low: 0.5 },
                }),
                compress({
                    png: 'omit',
                    webp: true,
                    jpg: true,
                    astc: true,
                }),
                spineAtlasMipmap({
                    resolutions: { default: 1, low: 0.5 },
                }),
                spineAtlasCompress({
                    png: 'omit',
                    webp: true,
                    astc: true,
                }),
                cacheBuster(),
                spineAtlasCacheBuster(),
            ],
        });

        await assetpack.run();
        const globPath = `${outputDir}/*.{atlas,png,webp,astc.ktx}`;
        const files = await glob(globPath);

        // need two sets of files
        expect(files.length).toBe(12);
        expect(files.filter((file) => file.endsWith('.atlas')).length).toBe(4);
        expect(files.filter((file) => file.endsWith('.png')).length).toBe(0);
        expect(files.filter((file) => file.endsWith('.webp')).length).toBe(4);
        expect(files.filter((file) => file.endsWith('.astc.ktx')).length).toBe(4);
        expect(files.filter((file) => file.endsWith('.jpg')).length).toBe(0);

        const atlasFiles = files.filter((file) => file.endsWith('.atlas'));
        const pngFiles = files.filter((file) => file.endsWith('.png'));
        const webpFiles = files.filter((file) => file.endsWith('.webp'));
        const astcFiles = files.filter((file) => file.endsWith('.astc.ktx'));

        // check that the files are correct
        atlasFiles.forEach((atlasFile) => {
            const rawAtlas = readFileSync(atlasFile);
            const isHalfSize = atlasFile.includes('@0.5x');
            const isWebp = atlasFile.includes('.webp');
            const isPng = atlasFile.includes('.png');
            const isAstc = atlasFile.includes('.astc');

            const checkFiles = (fileList: string[], isHalfSize: boolean, isFileType: boolean) => {
                fileList.forEach((file) => {
                    // remove the outputDir
                    file = file.replace(`${outputDir}/`, '');
                    const isFileHalfSize = file.includes('@0.5x');
                    // eslint-disable-next-line no-nested-ternary
                    const isFileFileType = file.includes(isWebp ? '.webp' : isAstc ? '.astc' : '.png');
                    const shouldExist = isHalfSize === isFileHalfSize && isFileType === isFileFileType;

                    expect(rawAtlas.includes(file)).toBe(shouldExist);
                });
            };

            if (isHalfSize) {
                if (isWebp) {
                    checkFiles(webpFiles, true, true);
                } else if (isPng) {
                    checkFiles(pngFiles, true, true);
                } else if (isAstc) {
                    checkFiles(astcFiles, true, true);
                }
            } else if (isWebp) {
                checkFiles(webpFiles, false, true);
            } else if (isPng) {
                checkFiles(pngFiles, false, true);
            } else if (isAstc) {
                checkFiles(astcFiles, false, true);
            }
        });
    });
});
