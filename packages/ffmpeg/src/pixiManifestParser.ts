import type { ChildTree, Processor } from '@assetpack/core';
import { Logger, path, SavableAssetCache } from '@assetpack/core';
import type { PixiManifestEntry } from '@assetpack/plugin-manifest';
import { defaultPixiParser } from '@assetpack/plugin-manifest';

function parser(tree: ChildTree, processor: Processor): PixiManifestEntry[]
{
    const transformData = SavableAssetCache.get(tree.path).transformData;

    if (transformData.files.length > 1)
    {
        Logger.warn(
            `[pixiManifestAudio]: ${tree.path} has more than one transformed file. Falling back to defaultPixiParser.`
        );

        return defaultPixiParser(tree, processor);
    }

    const name = processor.trimOutputPath(processor.inputToOutput(tree.path));
    const extensions = transformData.files[0].transformedPaths.map((transformedPath) =>
        path.extname(transformedPath).replace('.', ''));

    extensions.push(path.extname(transformData.files[0].path).replace('.', ''));

    const data = {
        name,
        srcs: [`${path.removeExt(name, path.extname(name))}.{${extensions.join(',')}}`]
    };

    return [data];
}

export const pixiManifeseFfmpeg = {
    type: 'ffmpeg',
    parser,
};

export const pixiManifestAudio = {
    type: 'audio',
    parser,
};
