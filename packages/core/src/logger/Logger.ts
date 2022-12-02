import type { AssetpackConfig } from '../rc';
import { LogLevels } from './logLevel';
import type { ReporterEvent } from './Reporter';
import { Reporter } from './Reporter';

class LoggerClass
{
    private _reporter: Reporter = new Reporter();

    public init(config: AssetpackConfig)
    {
        this._reporter.level = config.logLevel || LogLevels.info;
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
        this._reporter.report(event);
    }
}

export const Logger = new LoggerClass();
