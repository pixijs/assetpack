import { glob } from 'glob';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { pixiManifest } from '../../src/manifest/index.js';
import { fntWithPic } from '../../src/webfont/index.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'webfont';

describe('Webfont', () =>
{
    it('should generate a bmfont from png files', async () =>
    {
        const testName = 'fnt-with-pic';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [{
                    name: 'test{fnt}',
                    files: [
                        ...'0123456789'.split('')
                            .map((n) => ({
                                name: `${n}.png`,
                                content: assetPath(`font/fntpic/${n}.png`),
                            })),
                    ],
                    folders: [],
                }],
            },
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                fntWithPic(),
            ],
        });

        await assetpack.run();

        const globPath = path.join(outputDir, '*.{fnt,png,webp}')
            .replaceAll('\\', '/');
        const files = await glob(globPath);

        expect(files.length)
            .toBe(2);
        expect(files.filter((file) => file.endsWith('.fnt')).length)
            .toBe(1);
        expect(files.filter((file) => file.endsWith('.png')).length)
            .toBe(1);
    });

    it('should generate a split bmfont from png files', async () =>
    {
        const testName = 'fnt-with-pic-split';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [{
                    name: 'test{fnt}',
                    files: [
                        ...'0123456789'.split('')
                            .map((n) => ({
                                name: `${n}.png`,
                                content: assetPath(`font/fntpic/${n}.png`),
                            })),
                    ],
                    folders: [],
                }],
            },
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                fntWithPic({
                    font: {
                        textureSize: [128, 128],
                    }
                }),
                pixiManifest({
                    createShortcuts: true,
                }),
            ],
        });

        await assetpack.run();

        const globPath = path.join(outputDir, '*.{fnt,png,webp}')
            .replaceAll('\\', '/');
        const files = await glob(globPath);

        expect(files.length)
            .toBe(6);
        expect(files.filter((file) => file.endsWith('.fnt')).length)
            .toBe(1);
        expect(files.filter((file) => file.endsWith('.png')).length)
            .toBe(5);
    });
});
