import { existsSync } from 'fs-extra';
import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';
import { AssetPack } from '@play-co/assetpack-core';
import { audio } from '@play-co/assetpack-plugin-ffmpeg';

const pkg = 'ffmpeg';

describe('Audio', () =>
{
    it('should create mp3 and ogg file formats', async () =>
    {
        const testName = 'audio-convert';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: '1.mp3',
                        content: assetPath(pkg, '1.mp3'),
                    },
                    {
                        name: '2.mp3',
                        content: assetPath(pkg, '2.mp3'),
                    },
                ],
                folders: [],
            });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [
                audio()
            ]
        });

        await assetpack.run();

        // expect json file to be generated
        expect(existsSync(`${outputDir}/1.mp3`)).toBe(true);
        expect(existsSync(`${outputDir}/1.ogg`)).toBe(true);
        expect(existsSync(`${outputDir}/2.mp3`)).toBe(true);
        expect(existsSync(`${outputDir}/2.ogg`)).toBe(true);
    });

    it('should allow for settings to be overridden', async () =>
    {
        const testName = 'audio-overrides';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: '1.mp3',
                        content: assetPath(pkg, '1.mp3'),
                    },
                    {
                        name: '2.mp3',
                        content: assetPath(pkg, '2.mp3'),
                    },
                ],
                folders: [],
            });

        const plugin = audio({
            name: 'audio',
            inputs: ['doNotMatch'],
            outputs: []
        });

        const plugin2 = audio({
            name: 'audio2',
            inputs: ['.mp3'],
            outputs: [{
                formats: ['.wav'],
                recompress: false,
                options: {}
            }]
        });

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            cache: false,
            pipes: [
                plugin,
                plugin2
            ]
        });

        const mock = jest.spyOn(plugin, 'transform');

        await assetpack.run();

        expect(mock).not.toHaveBeenCalled();

        expect(existsSync(`${outputDir}/1.mp3`)).toBe(false);
        expect(existsSync(`${outputDir}/2.mp3`)).toBe(false);
        expect(existsSync(`${outputDir}/1.wav`)).toBe(true);
        expect(existsSync(`${outputDir}/2.wav`)).toBe(true);
    });
});
