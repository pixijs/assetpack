import { Reporter } from './Reporter.js';

import type { LogLevelKeys } from './logLevel.js';
import type { ReporterEvent } from './Reporter.js';

export interface LoggerOptions
{
    level: LogLevelKeys;
    strict: boolean;
}

class LoggerClass
{
    private _reporter: Reporter = new Reporter();
    private strict = false;

    public init(options: LoggerOptions)
    {
        this._reporter.level = options.level || 'info';
        this.strict = options.strict;
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

        if (this.strict)
        {
            this.report({ type: 'buildFailure' });
            process.exit(1);
        }
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
        this._reporter.report(event);
    }
}

export const Logger = new LoggerClass();
