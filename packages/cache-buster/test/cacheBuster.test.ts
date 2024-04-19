import { AssetPack, joinSafe } from '@play-co/assetpack-core';
import { existsSync, readFileSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { cacheBuster, crc32 } from '../src';

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
                        content: assetPath(pkg, 'Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: true,
            pipes: [
                cacheBuster()
            ]
        });

        await assetpack.run();

        const originalPath = joinSafe('.testInput', testName, 'ttf.ttf');

        const buffer = readFileSync(originalPath);

        const hash = crc32(buffer);

        expect(existsSync(joinSafe('.testOutput', testName, `ttf-${hash}.ttf`))).toBe(true);
    });
});
