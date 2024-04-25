import { AssetPack } from '@play-co/assetpack-core';
import { mipmapCompress } from '@play-co/assetpack-plugin-mipmap-compress';
import { existsSync, readFileSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { spineAtlasCompress } from '../src/spineAtlasCompress';
import { spineAtlasMipmap } from '../src/spineAtlasMipmap';
import { cacheBuster } from '@play-co/assetpack-plugin-cache-buster';
import { spineAtlasCacheBuster } from '../src/spineAtlasCacheBuster';

const pkg = 'spine';

describe('Spine Atlas All', () =>
{
    it('should correctly create files when Mipmap and Compress are used', async () =>
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

    it.only('should correctly create files when Mipmap and CacheBuster are used', async () =>
    {
        const testName = 'spine-atlas-mip-cache-buster';
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
                cacheBuster(),
                spineAtlasCacheBuster()
            ]
        });

        await assetpack.run();

        [
            {
                atlas: `dragon@0.5x.webp-gWXF6w.atlas`,
                png1: `dragon@0.5x-7mmX8g.webp`,
                png2: `dragon2@0.5x-k_22pw.webp`
            },
            {
                atlas: `dragon.webp-spj8.atlas`,
                png1: `dragon-rSwKOg.webp`,
                png2: `dragon2-ws3uhw.webp`
            },
            {
                atlas: `dragon@0.5x.png-jg5ydg.atlas`,
                png1: `dragon@0.5x-3--s.png`,
                png2: `dragon2@0.5x-vflfww.png`
            },
            {
                atlas: `dragon.png-O471eg.atlas`,
                png1: `dragon-vezElA.png`,
                png2: `dragon2-3UnJNw.png`
            }
        ].forEach(({ atlas, png1, png2 }) =>
        {
            const rawAtlas = readFileSync(`${outputDir}/${atlas}`);

            expect(rawAtlas.includes(png1)).toBeTruthy();
            expect(rawAtlas.includes(png2)).toBeTruthy();

            expect(existsSync(`${outputDir}/${png1}`)).toBeTruthy();
            expect(existsSync(`${outputDir}/${png2}`)).toBeTruthy();
        });
    });
});
