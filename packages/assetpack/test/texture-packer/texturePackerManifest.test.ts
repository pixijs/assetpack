import fs from 'fs-extra';
import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { compress } from '../../src/image/compress.js';
import { pixiManifest } from '../../src/manifest/index.js';
import { texturePacker, texturePackerCompress } from '../../src/texture-packer/index.js';
import { createTPSFolder } from '../utils/createTPSFolder.js';
import { getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'texture-packer';

describe('Texture Packer Compression', () =>
{
    it('should create a sprite sheet', async () =>
    {
        const testName = 'tp-manifest';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createTPSFolder(testName, pkg);

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1 },
                    },
                }),
                pixiManifest(),
            ]
        });

        await assetpack.run();

        const manifest = fs.readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[0].assets[0]).toEqual({

            alias: [
                'sprites'
            ],
            src: [
                'sprites.json'
            ],
            data: {
                tags: {
                    tps: true
                }
            }

        });
    });

    it('should create a multi page sprite sheet', async () =>
    {
        const testName = 'tp-manifest-multi-page';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createTPSFolder(testName, pkg);
        const compressOpt = {
            astc: true,
            basis: true
        };

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                texturePacker({
                    resolutionOptions: {
                        resolutions: { default: 1, low: 0.5 },
                        maximumTextureSize: 512,
                    },
                }),
                compress(compressOpt),
                texturePackerCompress(compressOpt),
                pixiManifest(),
            ]
        });

        await assetpack.run();

        const manifest = fs.readJSONSync(`${outputDir}/manifest.json`);

        expect(manifest.bundles[0].assets).toEqual([
            {
                alias: [
                    'sprites'
                ],
                src: [
                    'sprites-0@0.5x.webp.json',
                    'sprites-0@0.5x.png.json',
                    'sprites-0@0.5x.basis.json',
                    'sprites-0@0.5x.astc.json',
                    'sprites-0.webp.json',
                    'sprites-0.png.json',
                    'sprites-0.basis.json',
                    'sprites-0.astc.json',
                ],
                data: {
                    tags: {
                        tps: true
                    }
                }
            },
        ]);
    });
});
