/* eslint-disable no-console */
import type { AssetPackConfig } from '@assetpack/core';
import { AssetPack } from '@assetpack/core';
import chalk from 'chalk';
import { Command } from 'commander';
import findUp from 'find-up';
import path from 'path';
import { pathToFileURL } from 'url';

interface Options
{
    config: string;
    watch: boolean;
}

const program = new Command();

program.description('Our New CLI');
program.version('0.2.0');
program.option('-c, --config <path>', 'config file to use');
// TODO: add watch option
// program.option('-w, --watch', 'watch for changes');

async function main()
{
    await program.parseAsync();

    const options = program.opts<Options>();

    // if config exist then use that path, otherwise use find-up
    const configPath = options.config ? path.resolve(process.cwd(), options.config) : await findUp(
        '.assetpack.js',
        { cwd: process.cwd() },
    );

    if (!configPath)
    {
        logEvent({
            message: 'No config file found',
            level: 'error',
        });
        process.exit(1);
    }

    const fileURL = pathToFileURL(configPath);
    const config = (await import(fileURL.toString())).default as AssetPackConfig;

    if (!config)
    {
        logEvent({
            message: 'Config file found, but could not be read',
            level: 'error',
        });
        process.exit(1);
    }

    const assetpack = new AssetPack(config);

    await assetpack.run();
}

function logEvent(event: {
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

console.log(); // log a new line so there is a nice space
main();
