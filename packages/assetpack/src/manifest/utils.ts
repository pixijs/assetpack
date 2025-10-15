import fs from 'fs-extra';
import zlib from 'node:zlib';
import { BuildReporter } from '../core/index.js';

export function getManifestName(path: string, entry: string): string | null {
    // Get the string after the entry path
    const val = path.replace(entry, '');
    // Get the string after the last /{m}/
    const res = val
        .split('/')
        .filter((v: string) => v.match(/{m}/) !== null)
        .at(-1) as string;

    if (!res) return null;

    // Split the string after the last /{m}/
    const split = val.split(res);
    // Remove the {m} from the string
    let targetPath = (split[0] + res).replace(/{(.*?)}/g, '');

    // Remove the leading and trailing /
    if (targetPath.startsWith('/')) targetPath = targetPath.slice(1);
    if (targetPath.endsWith('/')) targetPath = targetPath.slice(0, -1);

    return targetPath;
}

export function getFileSizeInKB(filePath: string, useRaw = false): number {
    let size = 0;

    try {
        if (useRaw) {
            size = fs.statSync(filePath).size;
        } else {
            size = zlib.gzipSync(fs.readFileSync(filePath)).length;
        }
        size = Number((size / 1024).toFixed(2));
    } catch (_e) {
        BuildReporter.warn(`[AssetPack] Unable to get size for asset '${filePath}'. Skipping file size entry.`);
        size = 1;
    }

    return size;
}
