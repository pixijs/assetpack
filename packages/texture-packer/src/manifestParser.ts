import type { ChildTree, Processor, TransformData } from '@assetpack/core';
import { path, SavableAssetCache } from '@assetpack/core';
import type { PixiManifestEntry } from '@assetpack/manifest';

// "transformData": {
//     "type": "texture-packer",
//     "resolutions": [0.5, 1],
//     "prefix": "@%%x",
//     "tags": ["tps"],
//     "files": [
//         {
//             "path": "user/output/path/to/asset-0.json",
//             "transformedPaths": [
//                 "user/output/path/to/asset-0.webp.json",
//             ]
//         },
//     ]
// }
export interface TPTransformData extends TransformData
{
    prefix: string;
    resolutions: number[]
}

function simpleManifestParser(tree: ChildTree, processor: Processor): string[]
{
    const savedData = SavableAssetCache.get(tree.path);
    const transformData = savedData.transformData as TPTransformData;

    const transformPath = (filePath: string, res: number, prefix: string, ext: string) =>
    {
        const prefixModified = prefix.replace('%%', res.toString());

        return filePath.replace(ext, `${prefixModified}${ext}`);
    };

    const allFiles: string[] = [];

    transformData.files.forEach((file) =>
    {
        const files: string[] = transformData.resolutions.map((res) =>
        {
            const ext = path.extname(file.path);
            const prefix = transformData.prefix;

            const name = transformPath(processor.trimOutputPath(file.path), res, prefix, ext);
            const transformedPaths = file.transformedPaths.map((transformedPath) =>
                transformPath(processor.trimOutputPath(transformedPath), res, prefix, path.extname(transformedPath))
            );

            return [name, ...transformedPaths].flat();
        }).flat();

        allFiles.push(...files);
    });

    return allFiles;
}

function pixiManifestParser(tree: ChildTree, processor: Processor): PixiManifestEntry[]
{
    const savedData = SavableAssetCache.get(tree.path);
    const transformData = savedData.transformData as TPTransformData;

    const transformPath = (filePath: string, res: string, prefix: string, ext: string) =>
    {
        const prefixModified = prefix.replace('%%', res);

        return filePath.replace(ext, `${prefixModified}${ext}`);
    };

    const res = transformData.files.map((file) =>
    {
        const ext = path.extname(file.path);
        const prefix = transformData.prefix;
        const resolutions = `{${transformData.resolutions.map((res) => res.toString()).join(',')}}`;
        const name = transformPath(processor.trimOutputPath(file.path), resolutions, prefix, ext);
        const extensions = file.transformedPaths.map((transformedPath) =>
            path.extname(transformedPath).replace('.', ''));

        extensions.push(ext.replace('.', ''));

        const fullname = `${path.removeExt(name, ext)}.{${extensions.join(',')}}`;

        return {
            name: processor.trimOutputPath(file.path),
            srcs: [fullname],
        };
    });

    return res;
}

export const texturePackerParser = {
    type: 'texture-packer',
    parser: simpleManifestParser,
};

export const pixiTexturePackerParser = {
    type: 'texture-packer',
    parser: pixiManifestParser,
};
