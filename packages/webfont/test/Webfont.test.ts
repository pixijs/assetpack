import { AssetPack } from '@assetpack/core';
import { existsSync, readJSONSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { webfont } from '../src';
import { pixiManifest } from '@assetpack/plugin-manifest';

const pkg = 'webfont';

describe('Webfont', () =>
{
    it('should generate webfont from ttf file', async () =>
    {
        const testName = 'ttf';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'ttf.ttf',
                        content: assetPath(pkg, 'Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                webfont: webfont()
            }
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/ttf.woff2`)).toBe(true);
    });

    it('should generate webfont from otf file', async () =>
    {
        const testName = 'otf';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'otf.otf',
                        content: assetPath(pkg, 'Roboto-Regular.otf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                webfont: webfont()
            }
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/otf.woff2`)).toBe(true);
    });

    it('should generate webfont from svg file', async () =>
    {
        const testName = 'svg';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'svg{font}.svg',
                        content: assetPath(pkg, 'Roboto-Regular.svg'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                webfont: webfont()
            }
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/svg.woff2`)).toBe(true);
    });
    it('should generate manifest correctly', async () =>
    {
        const testName = 'webfont-manifest';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'defaultFolder',
                    files: [
                        {
                            name: 'ttf.ttf',
                            content: assetPath(pkg, 'Roboto-Regular.ttf'),
                        },
                    ],
                    folders: [],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                webfont: webfont(), // import is breaking definition file
                manifest: pixiManifest(),
            },
        });

        await assetpack.run();

        // load the manifest json
        const manifest = await readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[0]).toEqual({
            name: 'default',
            assets: [
                {
                    name: 'defaultFolder/ttf.ttf',
                    srcs: ['defaultFolder/ttf.woff2'],
                },
            ],
        });
    });
});
