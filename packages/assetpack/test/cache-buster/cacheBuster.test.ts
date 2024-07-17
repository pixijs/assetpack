import { existsSync } from 'node:fs';
import { join } from 'upath';
import { describe, expect, it } from 'vitest';
import { cacheBuster } from '../../src/cache-buster/index.js';
import { Asset, AssetPack, path } from '../../src/core/index.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'cache-buster';

describe('CacheBuster', () =>
{
    it('should hash a file', async () =>
    {
        const testName = 'cache-buster';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'ttf.ttf',
                        content: assetPath('font/Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir, cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: true,
            pipes: [
                cacheBuster()
            ]
        });

        await assetpack.run();

        const originalPath = path.joinSafe(inputDir, 'ttf.ttf');

        const asset = new Asset({
            path: originalPath,
        });

        expect(existsSync(join(outputDir, `ttf-${asset.hash}.ttf`))).toBe(true);
    });
});
