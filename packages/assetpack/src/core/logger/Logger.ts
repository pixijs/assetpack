import { Reporter } from './Reporter.js';

import type { LogLevelKeys } from './logLevel.js';
import type { ReporterEvent } from './Reporter.js';

export interface LoggerOptions
{
    level: LogLevelKeys;
}

class LoggerClass
{
    private _reporter: Reporter = new Reporter();

    public init(options: LoggerOptions)
    {
        this._reporter.level = options.level || 'info';
    }

    public verbose(message: string)
    {
        this.report({
            type: 'log',
            level: 'verbose',
            message,
        });
    }

    public log(message: string)
    {
        this.info(message);
    }

    public info(message: string)
    {
        this.report({
            type: 'log',
            level: 'info',
            message,
        });
    }

    public error(message: string)
    {
        this.report({
            type: 'log',
            level: 'error',
            message,
        });
    }

    public warn(message: string)
    {
        this.report({
            type: 'log',
            level: 'warn',
            message,
        });
    }

    public report(event: ReporterEvent)
    {
        // this._reporter.report(event);
    }
}

export const Logger = new LoggerClass();
