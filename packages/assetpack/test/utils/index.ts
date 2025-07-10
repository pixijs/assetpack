import fs from 'fs-extra';
import path from 'path';
import { vi } from 'vitest';

import type { AssetPipe } from '../../src/core/index.js';

export interface Folder {
    name: string;
    files: File[];
    folders: Folder[];
}

export interface File {
    name: string;
    content: string;
}

export function getOutputDir(pkg: string, test: string) {
    return path.join(path.join(process.cwd(), `packages/assetpack/test/${pkg}`), '.testOutput', test);
}

export function getInputDir(pkg: string, test: string) {
    return path.join(path.join(process.cwd(), `packages/assetpack/test/${pkg}`), '.testInput', test);
}

export function getCacheDir(pkg: string, test: string) {
    return path.join(process.cwd(), `packages/assetpack/test/cache/${pkg}`, `.${test}-cache`);
}

export function createFolder(pkg: string, folder: Folder, base?: string) {
    base = base || getInputDir(pkg, '');
    const baseFolder = path.join(base, folder.name);

    try {
        fs.unlinkSync(baseFolder);
    } catch (_e) {
        // do nothing
    }

    fs.ensureDirSync(baseFolder);

    folder.files.forEach((file) => {
        const filePath = path.join(baseFolder, file.name);

        fs.ensureFileSync(filePath);
        fs.copyFileSync(file.content, filePath);
    });
    folder.folders.forEach((folder) => {
        createFolder(pkg, folder, baseFolder);
    });
}

export function assetPath(pth: string): string {
    return path.join(process.cwd(), 'packages/assetpack/test/resources', pth);
}

export function createAssetPipe(
    data: Partial<Record<keyof AssetPipe, boolean | ((...params: any[]) => Promise<any>)>>,
    name?: string,
): AssetPipe {
    const convert = (key: keyof AssetPipe, _isTest = false) => {
        const d = data[key];

        if (d === undefined) return undefined;
        if (typeof d === 'function') return vi.fn(d);

        if (key === 'test') return vi.fn(() => true);
        if (key === 'transform') return vi.fn((a) => [a]);

        return vi.fn(async () => {
            /**/
        });
    };

    return {
        folder: data.folder || false,
        name: name ?? 'test',
        defaultOptions: {},
        tags: {},
        test: convert('test'),
        transform: convert('transform'),
        start: convert('start'),
        finish: convert('finish'),
    } as AssetPipe;
}

export type MockAssetPipe = Omit<Record<keyof AssetPipe, jest.Mock>, 'folder' | 'name'> & {
    folder: boolean;
    name: string;
};
