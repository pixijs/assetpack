import { AssetPack } from '@play-co/assetpack-core';
import { existsSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { compress } from '../src/compress';

const pkg = 'image';

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
            cache: false,
            pipes: [
                compress({
                    png: true,
                    webp: true,
                    avif: true,
                    jpg: true,
                }),
            ]
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

    it.only('should compress png with 1 plugin', async () =>
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
            cache: false,
            pipes: [
                compress({
                    png: true,
                    webp: true,
                    jpg: true,
                    avif: true,
                }),
            ],
            assetSettings: [{
                files: ['**/*.png'],
                settings: {
                    tags: {
                        nc: 'ncc',
                    }
                }
            }]
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
            cache: false,
            pipes: [
                compress({
                    webp: false,
                    avif: false,
                })
            ]
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
