import { AssetPack } from '@play-co/assetpack-core';
// import { cacheBuster } from '@play-co/assetpack-plugin-cache-buster';
import { mipmapCompress } from '@play-co/assetpack-plugin-mipmap-compress';
import { readFileSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { spineAtlasCompress } from '../src/spineAtlasCompress';
import { spineAtlasMipmap } from '../src/spineAtlasMipmap';

const pkg = 'spine';

describe('Spine Atlas All', () =>
{
    it.only('should correctly create files when Mipmap and Compress are used', async () =>
    {
        const testName = 'spine-atlas-compress-mip';
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
                mipmapCompress({
                    mipmap: {
                        resolutions: { default: 1, low: 0.5 },
                    },
                    compress: {
                        png: true,
                        jpg: true,
                        webp: true,
                    }
                }),
                spineAtlasMipmap({
                    resolutions: { default: 1, low: 0.5 },
                }),
                spineAtlasCompress({
                    png: true,
                    jpg: true,
                    webp: true,
                }),
            ]
        });

        await assetpack.run();

        const rawAtlasWebpHalf = readFileSync(`${outputDir}/dragon@0.5x.webp.atlas`);
        const rawAtlasHalf = readFileSync(`${outputDir}/dragon@0.5x.png.atlas`);

        expect(rawAtlasHalf.includes('dragon@0.5x.png')).toBeTruthy();
        expect(rawAtlasHalf.includes('dragon2@0.5x.png')).toBeTruthy();

        expect(rawAtlasWebpHalf.includes('dragon@0.5x.webp')).toBeTruthy();
        expect(rawAtlasWebpHalf.includes('dragon2@0.5x.webp')).toBeTruthy();
    });

    // it('should correctly create files when Mipmap and CacheBuster are used', async () =>
    // {
    //     const testName = 'spine-atlas-mip-cache-bust';
    //     const inputDir = getInputDir(pkg, testName);
    //     const outputDir = getOutputDir(pkg, testName);

    //     createFolder(
    //         pkg,
    //         {
    //             name: testName,
    //             files: [
    //                 {
    //                     name: 'dragon{spine}.atlas',
    //                     content: assetPath(pkg, 'dragon.atlas'),
    //                 },
    //                 {
    //                     name: 'dragon.png',
    //                     content: assetPath(pkg, 'dragon.png'),
    //                 },
    //                 {
    //                     name: 'dragon2.png',
    //                     content: assetPath(pkg, 'dragon2.png'),
    //                 },
    //             ],
    //             folders: [],
    //         });

    //     const assetpack = new AssetPack({
    //         entry: inputDir,
    //         output: outputDir,
    //         cache: false,
    //         pipes: [
    //             mipmapCompress({
    //                 mipmap: {
    //                     resolutions: { default: 1, low: 0.5 },
    //                 },
    //                 compress: false
    //             }),
    //             spineAtlasMipmap({
    //                 resolutions: { default: 1, low: 0.5 },
    //             }),
    //             spineAtlasCacheBuster(),
    //         ]
    //     });

    //     await assetpack.run();

    //     const rawAtlasHalf = readFileSync(`${outputDir}/dragon@0.5x-fnZePw.atlas`);

    //     expect(rawAtlasHalf.includes('dragon@0.5x.png')).toBeTruthy();
    //     expect(rawAtlasHalf.includes('dragon2@0.5x.png')).toBeTruthy();
    // });

    // it('should correctly create files when Mipmap, Compress and CacheBuster is used', async () =>
    // {
    //     const testName = 'spine-atlas-compress-mip-cache-bust';
    //     const inputDir = getInputDir(pkg, testName);
    //     const outputDir = getOutputDir(pkg, testName);

    //     createFolder(
    //         pkg,
    //         {
    //             name: testName,
    //             files: [
    //                 {
    //                     name: 'dragon{spine}.atlas',
    //                     content: assetPath(pkg, 'dragon.atlas'),
    //                 },
    //                 {
    //                     name: 'dragon.png',
    //                     content: assetPath(pkg, 'dragon.png'),
    //                 },
    //                 {
    //                     name: 'dragon2.png',
    //                     content: assetPath(pkg, 'dragon2.png'),
    //                 },
    //             ],
    //             folders: [],
    //         });

    //     const assetpack = new AssetPack({
    //         entry: inputDir,
    //         output: outputDir,
    //         cache: false,
    //         pipes: [
    //             mipmapCompress({
    //                 mipmap: {
    //                     resolutions: { default: 1, low: 0.5 },
    //                 },
    //                 compress: {
    //                     png: true,
    //                     jpg: true,
    //                     webp: true,
    //                 }
    //             }),
    //             spineAtlasMipmap({
    //                 resolutions: { default: 1, low: 0.5 },
    //             }),
    //             spineAtlasCompress({
    //                 formats: ['png', 'webp'],
    //             }),
    //             spineAtlasCacheBuster(),
    //             cacheBuster(),
    //         ]
    //     });

    //     await assetpack.run();

    //     // PNG
    //     const rawAtlasPng = readFileSync(`${outputDir}/dragon.png-tewCwA.atlas`);

    //     expect(rawAtlasPng.includes('dragon-LKVDyw.png')).toBeTruthy();
    //     expect(rawAtlasPng.includes('dragon2-2VO0bA.png')).toBeTruthy();

    //     // PNG Half
    //     const rawAtlasHalfPng = readFileSync(`${outputDir}/dragon@0.5x.png-fnZePw.atlas`);

    //     expect(rawAtlasHalfPng.includes('dragon@0.5x-5J8WyA.png')).toBeTruthy();
    //     expect(rawAtlasHalfPng.includes('dragon2@0.5x-EpwTqg.png')).toBeTruthy();

    //     // WEBP

    //     const rawAtlasWebp = readFileSync(`${outputDir}/dragon.webp-gU3DWg.atlas`);

    //     expect(rawAtlasWebp.includes('dragon-y2RyfA.webp')).toBeTruthy();
    //     expect(rawAtlasWebp.includes('dragon2--d7Qrg.webp')).toBeTruthy();

    //     // WEBP Half

    //     const rawAtlasWebpHalf = readFileSync(`${outputDir}/dragon@0.5x.webp-hMr_9A.atlas`);

    //     expect(rawAtlasWebpHalf.includes('dragon@0.5x-0iYM2g.webp')).toBeTruthy();
    //     expect(rawAtlasWebpHalf.includes('dragon2@0.5x-EpwTqg.webp')).toBeTruthy();
    // });

    // it('should correctly cache the files names if mimpmaping is used', async () =>
    // {
    //     const testName = 'spine-atlas-mipmap-cache-bust';
    //     const inputDir = getInputDir(pkg, testName);
    //     const outputDir = getOutputDir(pkg, testName);

    //     createFolder(
    //         pkg,
    //         {
    //             name: testName,
    //             files: [
    //                 {
    //                     name: 'dragon{spine}.atlas',
    //                     content: assetPath(pkg, 'dragon.atlas'),
    //                 },
    //                 {
    //                     name: 'dragon.png',
    //                     content: assetPath(pkg, 'dragon.png'),
    //                 },
    //                 {
    //                     name: 'dragon2.png',
    //                     content: assetPath(pkg, 'dragon2.png'),
    //                 },
    //             ],
    //             folders: [],
    //         });

    //     const assetpack = new AssetPack({
    //         entry: inputDir,
    //         output: outputDir,
    //         cache: false,
    //         pipes: [
    //             mipmapCompress(), // { compress: false }),
    //             spineAtlasMipmap(),
    //             cacheBuster(),
    //             spineAtlasCacheBuster(),
    //         ]
    //     });

    //     await assetpack.run();

    //     const rawAtlas = readFileSync(`${outputDir}/dragon-tewCwA.atlas`);

    //     expect(rawAtlas.includes('dragon-LKVDyw')).toBeTruthy();
    //     expect(rawAtlas.includes('dragon2-2VO0bA')).toBeTruthy();

    //     const rawAtlasHalf = readFileSync(`${outputDir}/dragon@0.5x-fnZePw.atlas`);

    //     expect(rawAtlasHalf.includes('dragon@0.5x-5J8WyA')).toBeTruthy();
    //     expect(rawAtlasHalf.includes('dragon2@0.5x-EpwTqg')).toBeTruthy();
    // });

    // it('should correctly cache the files names with compressed atlas', async () =>
    // {
    //     const testName = 'spine-atlas-compress-cache-bust';
    //     const inputDir = getInputDir(pkg, testName);
    //     const outputDir = getOutputDir(pkg, testName);

    //     createFolder(
    //         pkg,
    //         {
    //             name: testName,
    //             files: [
    //                 {
    //                     name: 'dragon{spine}.atlas',
    //                     content: assetPath(pkg, 'dragon.atlas'),
    //                 },
    //                 {
    //                     name: 'dragon.png',
    //                     content: assetPath(pkg, 'dragon.png'),
    //                 },
    //                 {
    //                     name: 'dragon2.png',
    //                     content: assetPath(pkg, 'dragon2.png'),
    //                 },
    //             ],
    //             folders: [],
    //         });

    //     const assetpack = new AssetPack({
    //         entry: inputDir,
    //         output: outputDir,
    //         cache: false,
    //         pipes: [
    //             mipmapCompress({
    //                 mipmap: false,
    //                 compress: {
    //                     png: true,
    //                     jpg: true,
    //                     webp: true,
    //                 }
    //             }), // { compress: false }),
    //             // spineAtlasMipmap(),
    //             cacheBuster(),
    //             // spineAtlasCacheBuster(),
    //         ]
    //     });

    //     await assetpack.run();

    //     const rawAtlas = readFileSync(`${outputDir}/dragon-tewCwA.atlas`);

    //     expect(rawAtlas.includes('dragon-LKVDyw')).toBeTruthy();
    //     expect(rawAtlas.includes('dragon2-2VO0bA')).toBeTruthy();

    //     const rawAtlasHalf = readFileSync(`${outputDir}/dragon@0.5x-fnZePw.atlas`);

    //     expect(rawAtlasHalf.includes('dragon@0.5x-5J8WyA')).toBeTruthy();
    //     expect(rawAtlasHalf.includes('dragon2@0.5x-EpwTqg')).toBeTruthy();
    // });
});
