/* eslint-disable no-console */
export { run } from '@oclif/core';
import type { AssetPackConfig } from '@assetpack/core';
import { AssetPack } from '@assetpack/core';
import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import findUp from 'find-up';
import path from 'path';
import { pathToFileURL } from 'url';

class Link extends Command
{
    static description = 'Runs AssetPack with the given config';

    static examples = [
        '<%= config.bin %> -c .assetpack.js',
    ];

    static flags = {
        // TODO: add watch flag
        // watch: Flags.boolean({
        //     char: 'w',
        //     description: 'watch for changes',
        //     default: false,
        // }),
        config: Flags.string({
            char: 'c',
            description: 'config file to use',
        }),
    };

    async run(): Promise<void>
    {
        const { flags } = await this.parse(Link);

        // if config exist then use that path, otherwise use find-up
        const configPath = flags.config ? path.resolve(process.cwd(), flags.config) : await findUp(
            '.assetpack.js',
            { cwd: process.cwd() },
        );

        if (!configPath)
        {
            this.logEvent({
                message: 'No config file found',
                level: 'error',
            });
            process.exit(1);
        }

        const fileURL = pathToFileURL(configPath);
        const config = (await import(fileURL.toString())).default as AssetPackConfig;

        if (!config)
        {
            this.logEvent({
                message: 'Config file found, but could not be read',
                level: 'error',
            });
            process.exit(1);
        }

        const assetpack = new AssetPack(config);

        await assetpack.run();
    }

    private logEvent(event: {
        message: string;
        level: 'verbose' | 'info' | 'warn' | 'error';
    })
    {
        switch (event.level)
        {
            case 'verbose':
            case 'info':
                console.log(
                    `${chalk.blue.bold('›')} Info: ${chalk.blue.bold(event.message)}`,
                );
                break;
            case 'warn':
                console.log(
                    `${chalk.yellow.bold('›')} Warn: ${chalk.yellow.bold(event.message)}`,
                );
                break;
            case 'error':
                console.log(
                    `${chalk.red.bold('›')} Error: ${chalk.red.bold(event.message)}`,
                );
                process.exit(1);
                break;
            default:
                throw new Error(`Unknown log level ${event.level}`);
        }
    }
}

module.exports = Link;
