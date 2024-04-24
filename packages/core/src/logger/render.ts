import type { Writable } from 'stream';
import cliProgress from 'cli-progress';

import readline from 'readline';
import { countLines } from './utils';
import chalk from 'chalk';

const stdout = process.stdout;
const stderr = process.stderr;

// Some state so we clear the output properly
let lineCount = 0;
let errorLineCount = 0;
let statusPersisted = false;

const persistedMessages: string[] = [];

export function writeOut(message: string, isError = false)
{
    const processedMessage = `${message}\n`;
    const lines = countLines(message);

    if (isError)
    {
        stderr.write(processedMessage);
        errorLineCount += lines;
    }
    else
    {
        stdout.write(processedMessage);
        lineCount += lines;
    }
}

export function persistMessage(message: string)
{
    if (persistedMessages.includes(message)) return;

    persistedMessages.push(message);
    writeOut(message);
}

function clearStream(stream: Writable, lines: number)
{
    readline.moveCursor(stream, 0, -lines);
    readline.clearScreenDown(stream);
}

// Reset the window's state
export function resetWindow()
{
    // If status has been persisted we add a line
    // Otherwise final states would remain in the terminal for rebuilds
    if (statusPersisted)
    {
        lineCount++;
        statusPersisted = false;
    }

    clearStream(stderr, errorLineCount);
    errorLineCount = 0;

    clearStream(stdout, lineCount);
    lineCount = 0;

    for (const m of persistedMessages)
    {
        writeOut(m);
    }
}

const progressBar = new cliProgress.SingleBar({
    format: `${chalk.green('{bar}')} {percentage}%`,
}, cliProgress.Presets.rect);

export function startProgress()
{
    progressBar.start(100, 0);
}

export function updateProgress(progress: number)
{
    progressBar.update(progress);
}

export function stopProgress()
{
    progressBar.stop();
}
