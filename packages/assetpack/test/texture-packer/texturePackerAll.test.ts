import fs from 'fs-extra';
import { glob } from 'glob';
import { describe, expect, it } from 'vitest';
import { cacheBuster } from '../../src/cache-buster/index.js';
import { AssetPack } from '../../src/core/index.js';
import { compress, mipmap } from '../../src/image/index.js';
import { texturePacker } from '../../src/texture-packer/texturePacker.js';
import { texturePackerCacheBuster } from '../../src/texture-packer/texturePackerCacheBuster.js';
import { texturePackerCompress } from '../../src/texture-packer/texturePackerCompress.js';
import { createTPSFolder } from '../utils/createTPSFolder.js';
import { getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'texture-packer';

describe('Texture Packer All', () =>
{
    it('should create a sprite sheet mip, compress and cache bust', async () =>
    {
        const testName = 'tp-all';
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
                        resolutions: { default: 1, low: 0.5 },
                    },
                }),
                mipmap({
                    resolutions: { default: 1, low: 0.5 },
                }),
                compress({
                    png: true,
                    jpg: true,
                    webp: true,
                    astc: true
                }),
                texturePackerCompress({
                    png: true,
                    webp: true,
                    astc: true
                }),
                cacheBuster(),
                texturePackerCacheBuster()
            ]
        });

        await assetpack.run();

        const globPath = `${outputDir}/*.{json,png,webp,astc.ktx}`;
        const files = await glob(globPath);

        // need two sets of files
        expect(files.length).toBe(12);
        expect(files.filter((file) => file.endsWith('.json')).length).toBe(6);
        expect(files.filter((file) => file.endsWith('.png')).length).toBe(2);
        expect(files.filter((file) => file.endsWith('.webp')).length).toBe(2);
        expect(files.filter((file) => file.endsWith('.astc.ktx')).length).toBe(2);
        expect(files.filter((file) => file.endsWith('.jpg')).length).toBe(0);

        const jsonFiles = files.filter((file) => file.endsWith('.json'));
        const pngFiles = files.filter((file) => file.endsWith('.png'));
        const webpFiles = files.filter((file) => file.endsWith('.webp'));
        const astcFiles = files.filter((file) => file.endsWith('.astc.ktx'));

        // check that the files are correct
        jsonFiles.forEach((jsonFile) =>
        {
            const rawJson = fs.readJSONSync(jsonFile);
            const isHalfSize = jsonFile.includes('@0.5x');
            const isWebp = jsonFile.includes('.webp');
            const isPng = jsonFile.includes('.png');
            const isAstc = jsonFile.includes('.astc');

            const checkFiles = (fileList: string[], isHalfSize: boolean, isFileType: boolean) =>
            {
                fileList.forEach((file) =>
                {
                    // remove the outputDir
                    file = file.replace(`${outputDir}/`, '');
                    const isFileHalfSize = file.includes('@0.5x');
                    // eslint-disable-next-line no-nested-ternary
                    const isFileFileType = file.includes(isWebp ? '.webp' : isAstc ? '.astc.ktx' : '.png');
                    const shouldExist = isHalfSize === isFileHalfSize && isFileType === isFileFileType;

                    shouldExist ? expect(rawJson.meta.image).toEqual(file) : expect(rawJson.meta.image).not.toEqual(file);
                });
            };

            if (isHalfSize)
            {
                if (isWebp)
                {
                    checkFiles(webpFiles, true, true);
                }
                else if (isPng)
                {
                    checkFiles(pngFiles, true, true);
                }
                else if (isAstc)
                {
                    checkFiles(astcFiles, true, true);
                }
            }
            else
                if (isWebp)
                {
                    checkFiles(webpFiles, false, true);
                }
                else if (isPng)
                {
                    checkFiles(pngFiles, false, true);
                }
                else if (isAstc)
                {
                    checkFiles(astcFiles, false, true);
                }
        });
    });
});
