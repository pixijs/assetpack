import { Reporter } from './Reporter.js';

import type { LogLevelKeys } from './logLevel.js';
import type { ReporterEvent } from './Reporter.js';

export interface BuildReporterOptions
{
    level: LogLevelKeys;
    strict: boolean;
}
/** @deprecated Use BuildReporterOptions instead */
export interface LoggerOptions extends BuildReporterOptions {}

class BuildReporterClass
{
    private _reporter: Reporter = new Reporter();
    private strict = false;

    public init(options: BuildReporterOptions)
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

export const BuildReporter = new BuildReporterClass();
/**
 * @deprecated Use BuildReporter instead
 */
export const Logger = BuildReporter;
