import type { MockAssetPipe } from '../../../shared/test/index';
import { createFolder, createAssetPipe, getInputDir, getOutputDir } from '../../../shared/test/index';
import type { Asset } from '../src/Asset';
import { AssetPack } from '../src/AssetPack';
import { extractTagsFromFileName } from '../src/utils/extractTagsFromFileName';

describe('Utils', () =>
{
    const pkg = 'core';

    it('should get path and file tags', async () =>
    {
        expect(true).toBe(true);
    });

    it('should extract tags from file name', async () =>
    {
        expect(extractTagsFromFileName('test')).toEqual({});
        expect(extractTagsFromFileName('test.json')).toEqual({});
        expect(extractTagsFromFileName('test{tag}.json')).toEqual({ tag: true });
        expect(extractTagsFromFileName('test{tag1}{tag2}.json')).toEqual({ tag1: true, tag2: true });
        expect(extractTagsFromFileName('test{tag1}{tag2=1}.json')).toEqual({ tag1: true, tag2: 1 });
        expect(extractTagsFromFileName('test{tag1=hi}.json')).toEqual({ tag1: 'hi' });
        expect(extractTagsFromFileName('test{tag1}{tag2=1&2}.json')).toEqual({ tag1: true, tag2: [1, 2] });
    });

    it.only('should allow for tags to be overridden', async () =>
    {
        const testName = 'tag-override';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [],
                folders: [
                    {
                        name: 'anything',
                        files: [],
                        folders: [],
                    },
                ],
            });

        let counter = 0;
        const plugin = createAssetPipe({
            folder: true,
            test: ((asset: Asset, _options: any) =>
            {
                counter++;
                if (counter === 1) return false;

                expect(asset.allMetaData).toEqual({
                    override: [1, 2]
                });

                return true;
            }) as any,
            start: true,
            finish: true,
            transform: true,
        }) as MockAssetPipe;

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            pipes: [
                plugin// as Plugin<any>
            ],
            cache: false,
            assetSettings: [
                {
                    files: ['**'],
                    metaData: {
                        override: [1, 2]
                    },
                },
            ]
        });

        await assetpack.run();
    });
});
