import { assetPath, createFolder, getInputDir, getOutputDir } from '../utils/index.js';
import { describe, expect, it } from 'vitest';
import { resvg } from '../../src/resvg/index.js';
import { AssetPack } from '../../src/core/index.js';
import { existsSync } from 'fs-extra';

const pkg = 'resvg';

describe('Resvg', () => {
    it("should create png formatted files", async () => {
        const testName = 'svg-convert';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: "pixijs-logo-full-dark.svg",
                        content: assetPath("vectors/pixijs-logo-full-dark.svg")
                    },
                    {
                        name: "pixijs-logo-transparent-light.svg",
                        content: assetPath("vectors/pixijs-logo-transparent-light.svg")
                    }
                ],
                folders: []
            });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [
                resvg()
            ]
        })

        await assetpack.run();

        expect(existsSync(`${outputDir}/pixijs-logo-full-dark.png`)).toBe(true);
        expect(existsSync(`${outputDir}/pixijs-logo-transparent-light.png`)).toBe(true);
    });
});
