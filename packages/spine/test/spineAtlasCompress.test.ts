import { AssetPack } from '@play-co/assetpack-core';
import { mipmapCompress } from '@play-co/assetpack-plugin-mipmap-compress';// assetpack-plugin-mipmap-compress';
import { readFileSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { spineAtlasCompress } from '../src/spineAtlasCompress';

const pkg = 'spine';

describe('Spine Atlas Compress', () =>
{
    it('should correctly cache the files names with compressed atlas', async () =>
    {
        const testName = 'spine-atlas-compress';
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
                mipmapCompress({
                    mipmap: false,
                    compress: {
                        png: true,
                        jpg: true,
                        webp: true,
                    }
                }),
                spineAtlasCompress({
                    png: true,
                    jpg: true,
                    webp: true,
                }),
            ]
        });

        await assetpack.run();

        const rawAtlasWebp = readFileSync(`${outputDir}/dragon.webp.atlas`);
        const rawAtlas = readFileSync(`${outputDir}/dragon.png.atlas`);

        expect(rawAtlas.includes('dragon.png')).toBeTruthy();
        expect(rawAtlas.includes('dragon2.png')).toBeTruthy();

        expect(rawAtlasWebp.includes('dragon.webp')).toBeTruthy();
        expect(rawAtlasWebp.includes('dragon2.webp')).toBeTruthy();
    });
});
