import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import termSize from 'term-size';

let terminalSize = termSize();

process.stdout.on('resize', () =>
{
    terminalSize = termSize();
});

export function countLines(message: string): number
{
    const { columns } = terminalSize;

    return stripAnsi(message)
        .split('\n')
        .reduce((p, line) => p + Math.ceil((stringWidth(line) || 1) / columns), 0);
}

export function prettifyTime(timeInMs: number): string
{
    return timeInMs < 1000 ? `${timeInMs}ms` : `${(timeInMs / 1000).toFixed(2)}s`;
}
