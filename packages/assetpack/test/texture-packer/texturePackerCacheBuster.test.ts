import fs from 'fs-extra';
import { glob } from 'glob';
import { describe, expect, it } from 'vitest';
import { cacheBuster } from '../../src/cache-buster/index.js';
import { AssetPack } from '../../src/core/index.js';
import { compress } from '../../src/image/compress.js';
import { texturePacker } from '../../src/texture-packer/texturePacker.js';
import { texturePackerCacheBuster } from '../../src/texture-packer/texturePackerCacheBuster.js';
import { texturePackerCompress } from '../../src/texture-packer/texturePackerCompress.js';
import { createTPSFolder } from '../utils/createTPSFolder.js';
import { getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'texture-packer';

describe('Texture Packer Cache Buster', () =>
{
    it('should create a sprite sheet and correctly update json', async () =>
    {
        const testName = 'tp-cache-bust';
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
                        maximumTextureSize: 512,
                    },
                }),
                cacheBuster(),
                texturePackerCacheBuster()
            ]
        });

        await assetpack.run();

        const globPath = `${outputDir}/*.{json,png}`;
        const files = await glob(globPath);
        // need two sets of files

        expect(files.length).toBe(4);
        expect(files.filter((file) => file.endsWith('.json')).length).toBe(2);
        expect(files.filter((file) => file.endsWith('.png')).length).toBe(2);

        const jsonFiles = files.filter((file) => file.endsWith('.json'));
        const pngFiles = files.filter((file) => file.endsWith('.png'));

        // check that the files are correct
        jsonFiles.forEach((jsonFile) =>
        {
            const rawJson = fs.readJSONSync(jsonFile);

            expect(pngFiles.includes(`${outputDir}/${rawJson.meta.image}`)).toBe(true);

            // check if json has related_multi_packs
            if (rawJson.meta.related_multi_packs)
            {
                const relatedMultiPacks = rawJson.meta.related_multi_packs as string[];

                expect(relatedMultiPacks.length).toBe(1);
                expect(jsonFiles.includes(`${outputDir}/${relatedMultiPacks[0]}`)).toBe(true);
            }
        });
    });

    it('should create compressed sprite sheet and correctly update json', async () =>
    {
        const testName = 'tp-cache-bust-compress';
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
                        maximumTextureSize: 512,
                    },
                }),
                compress(),
                texturePackerCompress(),
                cacheBuster(),
                texturePackerCacheBuster()
            ]
        });

        await assetpack.run();

        const globPath = `${outputDir}/*.{json,png,webp}`;
        const files = await glob(globPath);

        expect(files.length).toBe(8);
        expect(files.filter((file) => file.endsWith('.json')).length).toBe(4);
        expect(files.filter((file) => file.endsWith('.png')).length).toBe(2);
        expect(files.filter((file) => file.endsWith('.webp')).length).toBe(2);

        const jsonFiles = files.filter((file) => file.endsWith('.json'));
        const pngFiles = files.filter((file) => file.endsWith('.png'));
        const webpFiles = files.filter((file) => file.endsWith('.webp'));

        // check that the files are correct
        jsonFiles.forEach((jsonFile) =>
        {
            const rawJson = fs.readJSONSync(jsonFile);

            if (rawJson.meta.image.includes('.webp'))
            {
                expect(webpFiles.includes(`${outputDir}/${rawJson.meta.image}`)).toBe(true);
            }
            else
            {
                expect(pngFiles.includes(`${outputDir}/${rawJson.meta.image}`)).toBe(true);
            }

            // check if json has related_multi_packs
            if (rawJson.meta.related_multi_packs)
            {
                const relatedMultiPacks = rawJson.meta.related_multi_packs as string[];

                expect(relatedMultiPacks.length).toBe(1);
                expect(jsonFiles.includes(`${outputDir}/${relatedMultiPacks[0]}`)).toBe(true);
            }
        });
    });
});
