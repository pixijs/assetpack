import { existsSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { cacheBuster } from '../src';
import { Asset, AssetPack, path } from '@play-co/assetpack-core';

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

        const originalPath = path.joinSafe('.testInput', testName, 'ttf.ttf');

        const asset = new Asset({
            path: originalPath,
        });

        expect(existsSync(path.joinSafe('.testOutput', testName, `ttf-${asset.hash}.ttf`))).toBe(true);
    });
});
