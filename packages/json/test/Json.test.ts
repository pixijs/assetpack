import { AssetPack } from '@assetpack/core';
import { json } from '../src';
import { existsSync, readFileSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';

const pkg = 'json';

describe('Json', () =>
{
    it('should fail gracefully if json is malformed', async () =>
    {
        const testName = 'json-busted';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'busted.json',
                        content: assetPath(pkg, 'json-busted.json'),
                    },
                ],
                folders: [],
            }
        );

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                json: json()
            }
        });

        await assetpack.run();

        // expect json file to be generated
        expect(existsSync(`${outputDir}/busted.json`)).toBe(true);
    });

    it('should not modify the json if ignored', async () =>
    {
        const testName = 'json-ignore';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'json',
                        files: [
                            {
                                name: 'json{ignore}.json',
                                content: assetPath(pkg, 'json-busted.json'),
                            },
                        ],
                        folders: [],
                    },
                ],
            });
        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                json: json()
            }
        });

        const post = jest.spyOn(assetpack.config.plugins.json, 'post');

        await assetpack.run();

        const data = readFileSync(`${outputDir}/json/json.json`, 'utf8');
        const res = data.split('\n').length;

        expect(res).toEqual(5);
        expect(post).toHaveBeenCalledTimes(0);
    });

    it('should minify the json', async () =>
    {
        const testName = 'json-minify';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'json',
                        files: [
                            {
                                name: 'json.json',
                                content: assetPath(pkg, 'json-valid.json'),
                            },
                        ],
                        folders: [],
                    },
                ],
            });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                json: json()
            }
        });

        const post = jest.spyOn(assetpack.config.plugins.json, 'post');

        await assetpack.run();

        const data = readFileSync(`${outputDir}/json/json.json`, 'utf8');
        const res = data.split('\n').length;

        expect(res).toEqual(1);
        expect(post).toHaveBeenCalledTimes(1);
    });
});
