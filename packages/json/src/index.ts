import type { Plugin } from '@assetpack/core';
import { checkExt, Logger } from '@assetpack/core';
import fs from 'fs-extra';

export function json(): Plugin
{
    return {
        folder: false,
        test(tree)
        {
            return checkExt(tree.path, '.json');
        },
        async post(tree, processor)
        {
            let json = fs.readFileSync(tree.path, 'utf8');

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
