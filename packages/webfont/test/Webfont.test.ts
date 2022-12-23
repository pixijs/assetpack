import { Assetpack } from '@assetpack/core';
import { webfont } from '../src';
import { existsSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';

const pkg = 'webfont';

describe('Webfont', () =>
{
    it('should generate webfont from ttf file', async () =>
    {
        const testName = 'ttf';
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

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                webfont: webfont()
            }
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/ttf.woff2`)).toBe(true);
    });

    it('should generate webfont from otf file', async () =>
    {
        const testName = 'otf';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'otf.otf',
                        content: assetPath(pkg, 'Roboto-Regular.otf'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                webfont: webfont()
            }
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/otf.woff2`)).toBe(true);
    });

    it('should generate webfont from svg file', async () =>
    {
        const testName = 'svg';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'svg{font}.svg',
                        content: assetPath(pkg, 'Roboto-Regular.svg'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new Assetpack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                webfont: webfont()
            }
        });

        await assetpack.run();

        // expect webfont file to be generated
        expect(existsSync(`${outputDir}/svg.woff2`)).toBe(true);
    });
});
