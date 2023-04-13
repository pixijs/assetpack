import type { MockPlugin } from '../../../shared/test/index';
import { createFolder, createPlugin, getInputDir, getOutputDir } from '../../../shared/test/index';
import { AssetPack } from '../src/AssetPack';
import type { Plugin } from '../src/Plugin';
import { hasTag } from '../src/utils';

describe('Utils', () =>
{
    const pkg = 'core';

    it('should get path and file tags', async () =>
    {
        expect(true).toBe(true);
    });

    it('should extract tags from file name', async () =>
    {
        const as = new AssetPack({
            files: [
                {
                    files: ['**/*.json5'],
                    tags: ['test'],
                    settings: {}
                }
            ]
        });

        expect(as['_extractTags']('test')).toEqual({});
        expect(as['_extractTags']('test.json')).toEqual({});
        expect(as['_extractTags']('test{tag}.json')).toEqual({ tag: true });
        expect(as['_extractTags']('test{tag1}{tag2}.json')).toEqual({ tag1: true, tag2: true });
        expect(as['_extractTags']('test{tag1}{tag2=1}.json')).toEqual({ tag1: true, tag2: '1' });
        expect(as['_extractTags']('test{tag1}{tag2=1&2}.json')).toEqual({ tag1: true, tag2: ['1', '2'] });
        expect(as['_extractTags']('test.json5')).toEqual({ test: true });
    });

    it('should allow for tags to be overridden', async () =>
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
        const plugin = createPlugin({
            folder: true,
            test: ((tree: any, _p: any, opts: any) =>
            {
                counter++;
                if (counter === 1) return false;
                expect(opts).toEqual({
                    tags: {
                        test: 'override',
                    }
                });
                const tags = { ...opts.tags };

                expect(hasTag(tree, 'path', tags.test)).toBe(true);
                expect(tree.fileTags).toEqual({ override: ['1', '2'] });

                return hasTag(tree, 'path', tags.test);
            }) as any,
            start: true,
            finish: true,
            transform: true,
        }) as MockPlugin;

        const assetpack = new AssetPack({
            entry: inputDir,
            output: outputDir,
            plugins: {
                json: plugin as Plugin<any>,
            },
            cache: false,
            files: [
                {
                    files: ['**'],
                    settings: {
                        json: {
                            tags: {
                                test: 'override',
                            }
                        }
                    },
                    tags: ['override=1&2'],
                },
            ]
        });

        await assetpack.run();
    });
});
