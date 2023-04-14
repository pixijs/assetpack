import { AssetPack } from '@assetpack/core';
import { existsSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { compressJpg, compressPng, compressWebp } from '../src';
import { compressAvif } from '../src/avif';
import { compress } from '../src/compress';

const pkg = 'compress';

describe('Compress', () =>
{
    it('should compress png', async () =>
    {
        const testName = 'compress-png';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'testPng.png',
                        content: assetPath(pkg, 'sp-2.png'),
                    },
                    {
                        name: 'testJpg.jpg',
                        content: assetPath(pkg, 'sp-3.jpg'),
                    },
                ],
                folders: [],
            });
        const pack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                compressWebp: compressWebp(),
                compressAvif: compressAvif(),
                compress: compressPng(),
                compressJpg: compressJpg()
            }
        });

        await pack.run();

        expect(existsSync(`${outputDir}/testPng.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng.webp`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng.avif`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.jpg`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.webp`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.avif`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.png`)).toBe(false);
    });

    it('should compress png with 1 plugin', async () =>
    {
        const testName = 'compress-png-1-plugin';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'testPng.png',
                        content: assetPath(pkg, 'sp-2.png'),
                    },
                    {
                        name: 'testJpg.jpg',
                        content: assetPath(pkg, 'sp-3.jpg'),
                    },
                ],
                folders: [],
            });
        const pack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                compress: compress(),
            }
        });

        await pack.run();

        expect(existsSync(`${outputDir}/testPng.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng.webp`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng.avif`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.jpg`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.webp`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.avif`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.png`)).toBe(false);
    });

    it('should be able to turn off a compression', async () =>
    {
        const testName = 'compress-off';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'testPng.png',
                        content: assetPath(pkg, 'sp-2.png'),
                    },
                    {
                        name: 'testJpg.jpg',
                        content: assetPath(pkg, 'sp-3.jpg'),
                    },
                ],
                folders: [],
            });
        const pack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                compress: compress({
                    webp: false,
                    avif: false,
                }),
            }
        });

        await pack.run();

        expect(existsSync(`${outputDir}/testPng.png`)).toBe(true);
        expect(existsSync(`${outputDir}/testPng.webp`)).toBe(false);
        expect(existsSync(`${outputDir}/testPng.avif`)).toBe(false);
        expect(existsSync(`${outputDir}/testJpg.jpg`)).toBe(true);
        expect(existsSync(`${outputDir}/testJpg.webp`)).toBe(false);
        expect(existsSync(`${outputDir}/testJpg.avif`)).toBe(false);
        expect(existsSync(`${outputDir}/testJpg.png`)).toBe(false);
    });
});
