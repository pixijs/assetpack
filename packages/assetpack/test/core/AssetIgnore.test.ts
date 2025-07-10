import { describe, expect, it } from 'vitest';
import { AssetIgnore } from '../../src/core/AssetIgnore.js';

describe('AssetIgnore', () => {
    it('should ignore file based on globs', async () => {
        const assetIgnore = new AssetIgnore({
            ignore: '**/*.png',
            entryPath: 'test',
        });

        expect(assetIgnore.shouldIgnore('test/test.png')).toBe(true);
        expect(assetIgnore.shouldIgnore('test/test.jpg')).toBe(false);
    });

    it('should ignore file based on array globs', async () => {
        const assetIgnore = new AssetIgnore({
            ignore: ['**/*.png', '**/*.json'],
            entryPath: 'test',
        });

        expect(assetIgnore.shouldIgnore('test/test.png')).toBe(true);
        expect(assetIgnore.shouldIgnore('test/test.jpg')).toBe(false);
        expect(assetIgnore.shouldIgnore('test/test.json')).toBe(true);
    });
});
