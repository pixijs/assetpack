import chalk from 'chalk';
import { LogLevels } from './logLevel';
import { persistMessage, resetWindow, setSpinnerStatus, updateSpinner } from './render';
import { prettifyTime } from './utils';

export interface LogEvent
{
    type: 'log';
    level: keyof typeof LogLevels;
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
    public level: LogLevels = LogLevels.info;
    private _buildTime = 0;

    // Exported only for test
    public report(event: ReporterEvent): void
    {
        const logLevelFilter = LogLevels[this.level || 'info'];

        switch (event.type)
        {
            case 'buildStart': {
                if (logLevelFilter < LogLevels.info)
                {
                    break;
                }

                this._buildTime = Date.now();

                // Clear any previous output
                resetWindow();

                persistMessage(`${chalk.blue.bold('›')} ${chalk.blue.bold(`Building: ${event.message}`)}`);

                break;
            }
            case 'buildProgress': {
                if (logLevelFilter < LogLevels.info)
                {
                    break;
                }

                switch (event.phase)
                {
                    case 'start':
                        updateSpinner('Starting Plugins...');
                        break;
                    case 'delete':
                        setSpinnerStatus('success', 'Plugins Started');
                        updateSpinner('Cleaning Tree...');
                        break;
                    case 'transform':
                        setSpinnerStatus('success', 'Tree Cleaned');
                        updateSpinner('Transforming Assets...');
                        break;
                    case 'post':
                        setSpinnerStatus('success', 'Assets Transformed');
                        updateSpinner('Post Processing Assets...');
                        break;
                    case 'finish':
                        setSpinnerStatus('success', 'Assets Post Processed');
                        updateSpinner('Tearing Down Plugins...');
                        break;
                }
                break;
            }
            case 'buildSuccess':
                if (logLevelFilter < LogLevels.info)
                {
                    break;
                }

                setSpinnerStatus('success', 'Plugins Torn Down');
                resetWindow();

                persistMessage(chalk.green.bold(`› Built in: ${prettifyTime(Date.now() - this._buildTime)}`));
                break;
            case 'buildFailure':
                if (logLevelFilter < LogLevels.error)
                {
                    break;
                }

                resetWindow();

                setSpinnerStatus('error', chalk.red.bold('Build failed.'));

                break;
            case 'log': {
                if (logLevelFilter < LogLevels[event.level])
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
