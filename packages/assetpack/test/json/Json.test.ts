import { readJSONSync } from 'fs-extra';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { json } from '../../src/json/index.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'json';

describe('Json', () => {
    it('should fail gracefully if json is malformed', async () => {
        const testName = 'json-busted';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [
                {
                    name: 'busted.json',
                    content: assetPath('json/json-busted.json'),
                },
            ],
            folders: [],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [json()],
        });

        await assetpack.run();

        // expect json file to be generated
        expect(existsSync(`${outputDir}/busted.json`)).toBe(true);
    });

    it('should not modify the json if ignored', async () => {
        const testName = 'json-ignore';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'json',
                    files: [
                        {
                            name: 'json{nc}.json',
                            content: assetPath('json/json-busted.json'),
                        },
                    ],
                    folders: [],
                },
            ],
        });
        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [json()],
        });

        await assetpack.run();

        const data = readFileSync(`${outputDir}/json/json.json`, 'utf8');
        const res = data.split('\n').length;

        expect(res).toEqual(5);
    });

    it('should minify the json', async () => {
        const testName = 'json-minify';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [],
            folders: [
                {
                    name: 'json',
                    files: [
                        {
                            name: 'json.json',
                            content: assetPath('json/json-valid.json'),
                        },
                    ],
                    folders: [],
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [json()],
        });

        await assetpack.run();

        const data = readFileSync(`${outputDir}/json/json.json`, 'utf8');

        expect(data.replace(/\\/g, '').trim()).toEqual(`{"hello":"world","Im":"not broken"}`);
    });

    it('should support json5 format', async () => {
        const testName = 'json5';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [
                {
                    name: 'json5.json',
                    content: assetPath('json/json5.json'),
                },
                {
                    name: 'other-json-5.json5',
                    content: assetPath('json/json5.json'),
                },
            ],
            folders: [],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [json()],
        });

        await assetpack.run();

        const json5Data = readJSONSync(`${outputDir}/json5.json`, 'utf8');

        expect(json5Data).toEqual({ hello: 'world', Im: 'not broken' });

        expect(existsSync(`${outputDir}/other-json-5.json`)).toBe(true);
    });
});
