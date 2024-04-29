export enum LogLevel
    {
    none = 0,
    error = 1,
    warn = 2,
    info = 3,
    verbose = 4,
}

export type LogLevelKeys = keyof typeof LogLevel;
