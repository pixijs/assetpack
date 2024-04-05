import { AssetIgnore } from '../src/AssetIgnore';

describe('AssetIgnore', () =>
{
    it('should ignore file based on globs', async () =>
    {
        const assetIgnore = new AssetIgnore({
            ignore: '**/*.png',
            basePath: 'test',
        });

        expect(assetIgnore.shouldIgnore('test/test.png')).toBe(true);
        expect(assetIgnore.shouldIgnore('test/test.jpg')).toBe(false);
    });

    it('should ignore file based on array globs', async () =>
    {
        const assetIgnore = new AssetIgnore({
            ignore: ['**/*.png', '**/*.json'],
            basePath: 'test',
        });

        expect(assetIgnore.shouldIgnore('test/test.png')).toBe(true);
        expect(assetIgnore.shouldIgnore('test/test.jpg')).toBe(false);
        expect(assetIgnore.shouldIgnore('test/test.json')).toBe(true);
    });
});
