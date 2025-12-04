import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { compress } from '../../src/image/index.js';
import { spineAtlasCompress } from '../../src/spine/spineAtlasCompress.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'spine';

describe('Spine Atlas Compress', () => {
    it('should create atlas files for source format', async () => {
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
                }),
                spineAtlasCompress({
                    png: true,
                    webp: true,
                }),
            ],
        });

        await assetpack.run();

        // With our fix, only png.atlas should be created since the source textures are .png
        // The compress plugin creates webp variants as children, but they're not visible
        // at transform time, so we correctly only create atlas for the source format
        const rawAtlas = readFileSync(`${outputDir}/dragon.png.atlas`);

        expect(rawAtlas.includes('dragon.png')).toBeTruthy();
        expect(rawAtlas.includes('dragon2.png')).toBeTruthy();

        // webp.atlas should NOT be created (bug fix - prevents broken references)
        const { existsSync } = await import('node:fs');

        expect(existsSync(`${outputDir}/dragon.webp.atlas`)).toBeFalsy();
    });

    it('should only create atlas files for formats where textures exist', async () => {
        const testName = 'spine-atlas-compress-partial';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        // Create a scenario where spine textures are already in webp format only
        createFolder(pkg, {
            name: testName,
            files: [
                {
                    name: 'dragon{spine}.atlas',
                    content: assetPath('spine/dragon.atlas'),
                },
                {
                    name: 'dragon.webp',
                    content: assetPath('spine/dragon.png'),
                },
                {
                    name: 'dragon2.webp',
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
                // No compress plugin - textures stay as webp only
                spineAtlasCompress({
                    png: true,
                    webp: true,
                    avif: true,
                }),
            ],
        });

        await assetpack.run();

        // Should only create webp.atlas since textures only exist as webp
        const { existsSync } = await import('node:fs');

        expect(existsSync(`${outputDir}/dragon.webp.atlas`)).toBeTruthy();

        // Should NOT create png.atlas or avif.atlas since those textures don't exist
        expect(existsSync(`${outputDir}/dragon.png.atlas`)).toBeFalsy();
        expect(existsSync(`${outputDir}/dragon.avif.atlas`)).toBeFalsy();

        // Verify the webp.atlas content references webp textures
        const rawAtlasWebp = readFileSync(`${outputDir}/dragon.webp.atlas`);

        expect(rawAtlasWebp.includes('dragon.webp')).toBeTruthy();
        expect(rawAtlasWebp.includes('dragon2.webp')).toBeTruthy();
    });
});
