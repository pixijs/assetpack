import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { xml2json } from 'xml-js';
import { cacheBuster } from '../../src/cache-buster/index.js';
import { AssetPack } from '../../src/core/index.js';
import { sdfFont } from '../../src/webfont/index.js';
import { SDFCacheBuster } from '../../src/webfont/sdfCacheBuster.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

import type { charType, jsonType } from '../../src/webfont/index.js';

const pkg = 'webfont';

describe('Webfont', () =>
{
    it('should generate a sdf font from ttf file with custom config json', async () =>
    {
        const testName = 'sdf-customconfig';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'custom{sdf}{nc}{fix}.ttf',
                        content: assetPath('font/Roboto-Regular.ttf'),
                    },
                    {
                        name: 'custom{sdf}.json',
                        content: assetPath('font/custom.json'),
                    },
                    {
                        name: 'default{sdf}{nc}{fix}.ttf',
                        content: assetPath('font/Roboto-Regular.ttf'),
                    },
                ],
                folders: [],
            },
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [
                sdfFont({
                    font: {
                        charset: '0123456789',
                    },
                    resolutionOptions: {
                        template: '@%%x',
                    },
                }),
                cacheBuster(),
                SDFCacheBuster(),
            ],
        });

        await assetpack.run();

        const globPath = path.join(outputDir, '*.{fnt,png,webp}')
            .replaceAll('\\', '/');
        const files = await glob(globPath);

        expect(files.length)
            .toBe(4);
        expect(files.filter((file) => file.endsWith('.fnt')).length)
            .toBe(2);
        expect(files.filter((file) => file.endsWith('.png')).length)
            .toBe(2);

        const customFntFiles = files.filter((file) => path.parse(file)
            .name
            .startsWith('custom') && file.endsWith('.fnt'));

        customFntFiles.forEach((f) =>
        {
            const buffer = fs.readFileSync(f);
            const json: jsonType = JSON.parse(xml2json(buffer.toString(), { compact: true }));

            checkChars(json.font.chars.char, 'abcABC');
        });
    });
});

function checkChars(chars: charType[], str: string)
{
    const arr = str.split('');

    arr.forEach((charStr) =>
    {
        let has: boolean = false;

        chars.forEach((char) =>
        {
            if (char._attributes.char === charStr)
            {
                has = true;
            }
        });

        expect(has)
            .toBe(true);
    });
}
