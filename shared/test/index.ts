import fs, { unlinkSync } from 'fs-extra';
import path from 'path';
import { getRoot } from './find';
import type { AssetPipe } from '@assetpack/core';

export interface Folder
{
    name: string;
    files: File[];
    folders: Folder[];
}

export interface File
{
    name: string;
    content: string;
}

export function getOutputDir(pkg: string, test: string)
{
    return path.join(path.join(getRoot(), `packages/${pkg}`), '.testOutput', test);
}

export function getInputDir(pkg: string, test: string)
{
    return path.join(path.join(getRoot(), `packages/${pkg}`), '.testInput', test);
}

export function createFolder(pkg: string, folder: Folder, base?: string)
{
    base = base || getInputDir(pkg, '');
    const baseFolder = path.join(base, folder.name);

    try
    {
        unlinkSync(baseFolder);
    }
    catch (e)
    {
        // do nothing
    }

    fs.ensureDirSync(baseFolder);

    folder.files.forEach((file) =>
    {
        const filePath = path.join(baseFolder, file.name);

        fs.ensureFileSync(filePath);
        fs.copyFileSync(file.content, filePath);
    });
    folder.folders.forEach((folder) =>
    {
        createFolder(pkg, folder, baseFolder);
    });
}

export function assetPath(pkg: string, pth: string): string
{
    return path.join(path.join(getRoot(), `packages/${pkg}`), 'test/resources', pth);
}

export function createAssetPipe(
    data: Partial<Record<keyof AssetPipe, boolean | ((...params: any[]) => Promise<any>)>>,
    name?: string,
): AssetPipe
{
    const convert = (key: keyof AssetPipe, _isTest = false) =>
    {
        const d = data[key];

        if (d === undefined) return undefined;
        if (typeof d === 'function') return jest.fn(d);

        if (key === 'test') return jest.fn(() => true);
        if (key === 'transform') return jest.fn((a) => [a]);

        return jest.fn(async () => { /**/ });
    };

    return {
        folder: data.folder || false,
        name: name ?? 'test',
        defaultOptions: {},
        test: convert('test'),
        transform: convert('transform'),
        start: convert('start'),
        finish: convert('finish'),
    } as AssetPipe;
}

export type MockAssetPipe = Omit<Record<keyof AssetPipe, jest.Mock>, 'folder' | 'name'> & { folder: boolean, name: string };
