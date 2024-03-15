import minimatch from 'minimatch';
import { relative } from 'upath';

export interface AssetIgnoreOptions
{
    ignore: string | string[];
    basePath: string;
}

export class AssetIgnore
{
    private _ignore: string[];
    private _ignoreHash: Record<string, boolean> = {};
    private _basePath: string;

    constructor(options: AssetIgnoreOptions)
    {
        this._ignore = (Array.isArray(options.ignore) ? options.ignore : [options.ignore]) as string[];
        this._basePath = options.basePath;
    }

    public shouldIgnore(fullPath: string): boolean
    {
        const { _ignore, _ignoreHash } = this;

        if (_ignoreHash[fullPath] === undefined)
        {
            _ignoreHash[fullPath] = false;
            if (_ignore.length > 0)
            {
                const relativePath = relative(this._basePath, fullPath);

                for (let i = 0; i < _ignore.length; i++)
                {
                    if (minimatch(relativePath, _ignore[i]))
                    {
                        _ignoreHash[fullPath] = true;
                        break;
                    }
                }
            }
        }

        return _ignoreHash[fullPath];
    }

    public shouldInclude(fullPath: string): boolean
    {
        return !this.shouldIgnore(fullPath);
    }
}
