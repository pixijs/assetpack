import type { Plugin } from '@assetpack/core';
import { Logger, path } from '@assetpack/core';
import { readFileSync } from 'fs-extra';

export default function json(): Plugin
{
    return {
        folder: false,
        test(tree)
        {
            return path.extname(tree.path) === '.json';
        },
        async post(tree, processor)
        {
            let json = readFileSync(tree.path, 'utf8');

            try
            {
                json = JSON.stringify(JSON.parse(json));
            }
            catch (e)
            {
                Logger.warn(`[json] Failed to parse json file: ${tree.path}`);
            }

            processor.saveToOutput({
                tree,
                outputOptions: {
                    outputData: json,
                }
            });
        }
    };
}
