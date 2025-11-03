import fs from 'fs-extra';
import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { compress } from '../../src/image/index.js';
import { texturePacker, texturePackerCompress } from '../../src/texture-packer/index.js';
import { createTPSFolder } from '../utils/createTPSFolder.js';
import { getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'texture-packer';

describe('Texture Packer Compression', () => {
    it(
        'should create a sprite sheet',
        async () => {
            const testName = 'tp-compression';
            const inputDir = getInputDir(pkg, testName);
            const outputDir = getOutputDir(pkg, testName);

            createTPSFolder(testName, pkg);

            const compressOpt = {
                png: true,
                jpg: true,
                webp: true,
                astc: true,
                basis: true,
            };

            const assetpack = new AssetPack({
                entry: inputDir,
                cacheLocation: getCacheDir(pkg, testName),
                output: outputDir,
                cache: false,
                pipes: [
                    texturePacker({
                        resolutionOptions: {
                            resolutions: { default: 1 },
                        },
                    }),
                    compress(compressOpt),
                    texturePackerCompress(compressOpt),
                ],
            });

            await assetpack.run();

            const sheetPng = fs.readJSONSync(`${outputDir}/sprites.png.json`);
            const sheetWebp = fs.readJSONSync(`${outputDir}/sprites.webp.json`);
            const sheetAstc = fs.readJSONSync(`${outputDir}/sprites.astc.json`);
            const sheetBasis = fs.readJSONSync(`${outputDir}/sprites.basis.json`);

            expect(sheetPng.meta.image).toEqual(`sprites.png`);
            expect(sheetWebp.meta.image).toEqual(`sprites.webp`);
            expect(sheetAstc.meta.image).toEqual(`sprites.astc.ktx`);
            expect(sheetBasis.meta.image).toEqual(`sprites.basis.ktx2`);
        },
        { timeout: 20000 },
    );
});
