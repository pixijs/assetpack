import { AssetPack } from '@play-co/assetpack-core';
import { compress, mipmap } from '@play-co/assetpack-plugin-image';
import { readFileSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { spineAtlasCompress } from '../src/spineAtlasCompress';
import { spineAtlasMipmap } from '../src/spineAtlasMipmap';

const pkg = 'spine';

describe('Spine Atlas All', () =>
{
    it.only('should correctly create files when Mipmap and Compress are used', async () =>
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
                compress({
                    png: true,
                    webp: true,
                    jpg: true,
                }),
                mipmap({
                    resolutions: { default: 1, low: 0.5 },
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
});
