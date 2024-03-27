import chalk from 'chalk';
import type { LogLevel } from './logLevel';
import { LogLevelEnum } from './logLevel';
import { persistMessage, resetWindow, setSpinnerStatus, updateSpinner } from './render';
import { prettifyTime } from './utils';

export interface LogEvent
{
    type: 'log';
    level: LogLevel;
    message: string;
}

export interface BuildEvent
{
    type: 'buildStart' | 'buildProgress' | 'buildSuccess' | 'buildFailure'
    phase?: 'start' | 'delete' | 'transform' | 'post' | 'finish';
    message?: string;
}

export type ReporterEvent = LogEvent | BuildEvent;

function getProgressBar(ratio: number)
{
    const size = 40;
    const prog = [];

    for (let i = 0; i < size; i++)
    {
        if (ratio > (i / size))
        {
            prog.push('█');
        }
        else
        {
            prog.push('░');
        }
    }

    return prog.join('');
}
export class Reporter
{
    public level: LogLevel = 'info';
    private _buildTime = 0;

    // Exported only for test
    public report(event: ReporterEvent): void
    {
        const logLevelFilter = LogLevelEnum[this.level || 'info'];

        switch (event.type)
        {
            case 'buildStart': {
                if (logLevelFilter < LogLevelEnum.info)
                {
                    break;
                }

                this._buildTime = Date.now();
                updateSpinner('Starting Plugins...');
                // Clear any previous output
                resetWindow();

                /// / persistMessage(`${chalk.blue.bold('›')} ${chalk.blue.bold(`Building: ${event.message}`)}`);

                setSpinnerStatus('success', `AssetPack Initialized`);
                persistMessage(`${chalk.blue.bold('›')} ${chalk.blue.bold(`Building: ${event.message}`)}`);

                break;
            }
            case 'buildProgress': {
                if (logLevelFilter < LogLevelEnum.info)
                {
                    break;
                }

                // render a bar..
                const progress = parseInt(event.message || '0', 10) / 100;

                const progressBar = getProgressBar(progress);

                const message = `${progressBar} ${event.message}%`;

                updateSpinner(`${chalk.green(message)}`);

                break;
            }
            case 'buildSuccess':
                if (logLevelFilter < LogLevelEnum.info)
                {
                    break;
                }

                setSpinnerStatus('success', 'Build Complete');
                resetWindow();

                persistMessage(chalk.green.bold(`✔ AssetPack Completed in ${prettifyTime(Date.now() - this._buildTime)}`));
                break;
            case 'buildFailure':
                if (logLevelFilter < LogLevelEnum.error)
                {
                    break;
                }

                resetWindow();

                setSpinnerStatus('error', chalk.red.bold('Build failed.'));

                break;
            case 'log': {
                if (logLevelFilter < LogLevelEnum[event.level])
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
