import { AssetPack } from '@assetpack/core';
import { existsSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { generateAstc, generateBc, generateCompressedTex, generateEtc } from '../src';

const pkg = 'compressed-textures';

describe('Compressed textures', () =>
{
    it('should compress', async () =>
    {
        const testName = 'compress-textures';
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
                compressBc7: generateBc(),
                compressBc3: generateBc({
                    compression: {
                        type: 'BC3',
                        formatName: 's3tc',
                    },
                }),
                compressEtc: generateEtc({
                    compression: {
                        formatName: 'etc2',
                    },
                }),
                compressAstc: generateAstc(),
            },
        });

        await pack.run();

        expect(existsSync(`${outputDir}/testPng.astc.ktx`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testJpg.astc.ktx`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.etc2.ktx`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.bc7.dds`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.s3tc.dds`))
            .toBe(true);
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
                tex: generateCompressedTex(),
            },
        });

        await pack.run();

        expect(existsSync(`${outputDir}/testPng.astc.ktx`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.etc.ktx`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.bc7.dds`))
            .toBe(true);

        expect(existsSync(`${outputDir}/testJpg.astc.ktx`))
            .toBe(false);
        expect(existsSync(`${outputDir}/testJpg.etc.ktx`))
            .toBe(false);
        expect(existsSync(`${outputDir}/testJpg.bc7.dds`))
            .toBe(false);
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
                tex: generateCompressedTex({
                    ASTC: false,
                    BC7: false,
                }),
            },
        });

        await pack.run();

        expect(existsSync(`${outputDir}/testPng.astc.ktx`))
            .toBe(false);
        expect(existsSync(`${outputDir}/testPng.etc.ktx`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.bc7.dds`))
            .toBe(false);
    });

    it('should be able to override options', async () =>
    {
        const testName = 'override-options';
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
                tex: generateCompressedTex({
                    ASTC: {
                        formatName: 'test',
                    },
                    RGBA8: {
                        formatName: 'etc_RGBA8',
                    },
                    BC1: {
                        formatName: 'dxt1',
                    },
                    BC3: {
                        formatName: 'dxt5',
                    },
                }),
            },
        });

        await pack.run();

        expect(existsSync(`${outputDir}/testPng.test.ktx`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.astc.ktx`))
            .toBe(false);
        expect(existsSync(`${outputDir}/testPng.etc_RGBA8.ktx`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.etc.ktx`))
            .toBe(false);
        expect(existsSync(`${outputDir}/testPng.bc7.dds`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.dxt1.dds`))
            .toBe(true);
        expect(existsSync(`${outputDir}/testPng.dxt5.dds`))
            .toBe(true);
    });
});
