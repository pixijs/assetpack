import { minimatch } from 'minimatch';
import { path } from './utils/path.js';

export interface AssetIgnoreOptions {
    ignore: string | string[];
    entryPath: string;
}

export class AssetIgnore {
    private _ignore: string[];
    private _ignoreHash: Record<string, boolean> = {};
    private _entryPath: string;

    constructor(options: AssetIgnoreOptions) {
        this._ignore = (Array.isArray(options.ignore) ? options.ignore : [options.ignore]) as string[];
        this._entryPath = options.entryPath;
    }

    public shouldIgnore(fullPath: string): boolean {
        const { _ignore, _ignoreHash } = this;

        if (_ignoreHash[fullPath] === undefined) {
            _ignoreHash[fullPath] = false;
            if (_ignore.length > 0) {
                const relativePath = path.relative(this._entryPath, fullPath);

                for (let i = 0; i < _ignore.length; i++) {
                    if (minimatch(relativePath, _ignore[i])) {
                        _ignoreHash[fullPath] = true;
                        break;
                    }
                }
            }
        }

        return _ignoreHash[fullPath];
    }

    public shouldInclude(fullPath: string): boolean {
        return !this.shouldIgnore(fullPath);
    }
}
