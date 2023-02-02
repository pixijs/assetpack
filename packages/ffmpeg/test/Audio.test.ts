import { AssetPack } from '@assetpack/core';
import { audio } from '@assetpack/plugin-ffmpeg';
import { existsSync } from 'fs-extra';
import type { MockPlugin } from '../../../shared/test';
import { assetPath, createFolder, createPlugin, getInputDir, getOutputDir } from '../../../shared/test';

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
            plugins: {
                audio: audio()
            }
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
            inputs: ['doNotMatch'],
            outputs: []
        });
        const plugin2 = audio({
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
            plugins: {
                audio: plugin,
                audio2: plugin2
            }
        });

        const mock = jest.spyOn(plugin, 'transform');

        await assetpack.run();

        expect(mock).not.toHaveBeenCalled();
        expect(existsSync(`${outputDir}/1.mp3`)).toBe(false);
        expect(existsSync(`${outputDir}/2.mp3`)).toBe(false);
        expect(existsSync(`${outputDir}/1.wav`)).toBe(true);
        expect(existsSync(`${outputDir}/2.wav`)).toBe(true);
    });

    it('should add the transformed file to the tree to run post processing on', async () =>
    {
        const testName = 'audio-transformed';
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
                ],
                folders: [],
            });

        const postPlugin = createPlugin({
            test: true,
            post: true
        }) as MockPlugin;

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                audio: audio(),
                post: postPlugin
            }
        });

        await assetpack.run();

        expect(postPlugin.post).toHaveBeenCalled();

        // loop through mock post calls and see if the transformed file is in the tree

        const calls = postPlugin.post.mock.calls;
        let found = false;

        for (let i = 0; i < calls.length; i++)
        {
            const call = calls[i];
            const tree = call[0];
            const path = tree.path;
            const ext = path.substring(path.lastIndexOf('.'));

            if (ext === '.mp3')
            {
                found = true;
                break;
            }
        }

        expect(found).toBe(true);
    });
});
