import chalk from 'chalk';
import { LogLevel } from './logLevel';
import { persistMessage, resetWindow, startProgress, stopProgress, updateProgress } from './render';
import { prettifyTime } from './utils';

import type { LogLevelKeys } from './logLevel';

export interface LogEvent
{
    type: 'log';
    level: LogLevelKeys;
    message: string;
}

export interface BuildEvent
{
    type: 'buildStart' | 'buildProgress' | 'buildSuccess' | 'buildFailure'
    phase?: 'start' | 'delete' | 'transform' | 'post' | 'finish';
    message?: string;
}

export type ReporterEvent = LogEvent | BuildEvent;

export class Reporter
{
    public level: LogLevelKeys = 'info';
    private _buildTime = 0;

    // Exported only for test
    public report(event: ReporterEvent): void
    {
        const logLevelFilter = LogLevel[this.level || 'info'];

        switch (event.type)
        {
            case 'buildStart': {
                if (logLevelFilter < LogLevel.info)
                {
                    break;
                }

                this._buildTime = Date.now();
                // Clear any previous output
                resetWindow();
                persistMessage(chalk.green.bold(`✔ AssetPack Initialized`));
                persistMessage(`${chalk.blue.bold('›')} ${chalk.blue.bold(`Building: ${event.message}`)}`);
                startProgress();

                break;
            }
            case 'buildProgress': {
                if (logLevelFilter < LogLevel.info)
                {
                    break;
                }

                // render a bar..
                const progress = parseInt(event.message || '0', 10);

                updateProgress(progress);

                break;
            }
            case 'buildSuccess':
                if (logLevelFilter < LogLevel.info)
                {
                    break;
                }

                stopProgress();
                resetWindow();
                persistMessage(chalk.green.bold(`✔ AssetPack Completed in ${prettifyTime(Date.now() - this._buildTime)}`));
                break;
            case 'buildFailure':
                if (logLevelFilter < LogLevel.error)
                {
                    break;
                }

                stopProgress();
                resetWindow();
                persistMessage(chalk.green.bold(`✖ AssetPack Build Failed`));

                break;
            case 'log': {
                if (logLevelFilter < LogLevel[event.level])
                {
                    break;
                }

                switch (event.level)
                {
                    case 'verbose':
                    case 'info':
                        persistMessage(`${chalk.blue.bold('›')} Info: ${chalk.blue.bold(event.message)}`);
                        break;
                    case 'warn':
                        persistMessage(`${chalk.yellow.bold('›')} Warn: ${chalk.yellow.bold(event.message)}`);
                        break;
                    case 'error':
                        persistMessage(`${chalk.red.bold('›')} Error: ${chalk.red.bold(event.message)}`);
                        break;
                    default:
                        throw new Error(`Unknown log level ${event.level}`);
                }
            }
        }
    }
}
