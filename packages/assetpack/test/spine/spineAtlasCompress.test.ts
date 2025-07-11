import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { compress } from '../../src/image/index.js';
import { spineAtlasCompress } from '../../src/spine/spineAtlasCompress.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'spine';

describe('Spine Atlas Compress', () => {
    it('should correctly cache the files names with compressed atlas', async () => {
        const testName = 'spine-atlas-compress';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [
                {
                    name: 'dragon{spine}.atlas',
                    content: assetPath('spine/dragon.atlas'),
                },
                {
                    name: 'dragon.png',
                    content: assetPath('spine/dragon.png'),
                },
                {
                    name: 'dragon2.png',
                    content: assetPath('spine/dragon2.png'),
                },
            ],
            folders: [],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                compress({
                    png: true,
                    jpg: true,
                    webp: true,
                    astc: true,
                }),
                spineAtlasCompress({
                    png: true,
                    webp: true,
                    astc: true,
                }),
            ],
        });

        await assetpack.run();

        const rawAtlasAstc = readFileSync(`${outputDir}/dragon.astc.atlas`);
        const rawAtlasWebp = readFileSync(`${outputDir}/dragon.webp.atlas`);
        const rawAtlas = readFileSync(`${outputDir}/dragon.png.atlas`);

        expect(rawAtlas.includes('dragon.png')).toBeTruthy();
        expect(rawAtlas.includes('dragon2.png')).toBeTruthy();

        expect(rawAtlasWebp.includes('dragon.webp')).toBeTruthy();
        expect(rawAtlasWebp.includes('dragon2.webp')).toBeTruthy();

        expect(rawAtlasAstc.includes('dragon.astc.ktx')).toBeTruthy();
        expect(rawAtlasAstc.includes('dragon2.astc.ktx')).toBeTruthy();
    });
});
