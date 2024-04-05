export enum LogLevelEnum
    {
    none = 0,
    error = 1,
    warn = 2,
    info = 3,
    verbose = 4,
}

export type LogLevel = keyof typeof LogLevelEnum;
