import fs from 'fs-extra';
import type { Plugin } from 'packages/core/src/Plugin';
import path from 'path';
import { getRoot } from './find';

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

export function createPlugin(
    data: Partial<Record<keyof Plugin, boolean | ((...params: any[]) => Promise<any>)>>,
    name?: string,
): Plugin
{
    const convert = (key: keyof Plugin, isTest = false) =>
    {
        const d = data[key];

        if (d === undefined) return undefined;
        if (typeof d === 'function') return jest.fn(d);

        return isTest ? jest.fn(() => true) : jest.fn(async () => { /**/ });
    };

    return {
        folder: data.folder || false,
        name: name ?? 'test',
        cache: {},
        test: convert('test', true),
        transform: convert('transform'),
        start: convert('start'),
        finish: convert('finish'),
        post: convert('post'),
        delete: convert('delete'),
    } as Plugin;
}

export type MockPlugin = Omit<Record<keyof Plugin, jest.Mock>, 'folder' | 'name'> & { folder: boolean, name: string };
