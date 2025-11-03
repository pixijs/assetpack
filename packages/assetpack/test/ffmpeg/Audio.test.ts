import { existsSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { AssetPack } from '../../src/core/index.js';
import { audio } from '../../src/ffmpeg/index.js';
import { assetPath, createFolder, getCacheDir, getInputDir, getOutputDir } from '../utils/index.js';

const pkg = 'ffmpeg';

describe('Audio', () => {
    it('should create mp3 and ogg file formats', async () => {
        const testName = 'audio-convert';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [
                {
                    name: '1.mp3',
                    content: assetPath('audio/1.mp3'),
                },
                {
                    name: '2.mp3',
                    content: assetPath('audio/2.mp3'),
                },
            ],
            folders: [],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [audio()],
        });

        await assetpack.run();

        // expect json file to be generated
        expect(existsSync(`${outputDir}/1.mp3`)).toBe(true);
        expect(existsSync(`${outputDir}/1.ogg`)).toBe(true);
        expect(existsSync(`${outputDir}/2.mp3`)).toBe(true);
        expect(existsSync(`${outputDir}/2.ogg`)).toBe(true);
    });

    it('should allow for settings to be overridden', async () => {
        const testName = 'audio-overrides';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(pkg, {
            name: testName,
            files: [
                {
                    name: '1.mp3',
                    content: assetPath('audio/1.mp3'),
                },
                {
                    name: '2.mp3',
                    content: assetPath('audio/2.mp3'),
                },
            ],
            folders: [],
        });

        const plugin = audio({
            name: 'audio',
            inputs: ['doNotMatch'],
            outputs: [],
        });

        const plugin2 = audio({
            name: 'audio2',
            inputs: ['.mp3'],
            outputs: [
                {
                    formats: ['.wav'],
                    recompress: false,
                    options: {},
                },
            ],
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            cacheLocation: getCacheDir(pkg, testName),
            output: outputDir,
            cache: false,
            pipes: [plugin, plugin2],
        });

        const mock = vi.spyOn(plugin, 'transform');

        await assetpack.run();

        expect(mock).not.toHaveBeenCalled();

        expect(existsSync(`${outputDir}/1.mp3`)).toBe(false);
        expect(existsSync(`${outputDir}/2.mp3`)).toBe(false);
        expect(existsSync(`${outputDir}/1.wav`)).toBe(true);
        expect(existsSync(`${outputDir}/2.wav`)).toBe(true);
    });
});
