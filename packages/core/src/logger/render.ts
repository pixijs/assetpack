// @flow
import type { Writable } from 'stream';

import ora from 'ora';
import readline from 'readline';
import { countLines } from './utils';
import chalk from 'chalk';

const stdout = process.stdout;
const stderr = process.stderr;

// Some state so we clear the output properly
let lineCount = 0;
let errorLineCount = 0;
let statusPersisted = false;

const spinner = ora({
    color: 'green',
    stream: stdout,
    discardStdin: false,
    spinner: {
        interval: 120,
        frames: ['◐', '◓', '◑', '◒']
    }
});
const persistedMessages: string[] = [];

export function writeOut(message: string, isError = false)
{
    const processedMessage = `${message}\n`;
    const hasSpinner = spinner.isSpinning;

    // Stop spinner so we don't duplicate it
    if (hasSpinner)
    {
        spinner.stop();
    }

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

    // Restart the spinner
    if (hasSpinner)
    {
        spinner.start();
    }
}

export function persistMessage(message: string)
{
    if (persistedMessages.includes(message)) return;

    persistedMessages.push(message);
    writeOut(message);
}

export function setSpinnerStatus(type: 'success' | 'error' | 'warn' | 'info', message?: string)
{
    const curMessage = spinner.text.replace(/\n$/, '');

    if (type === 'error')
    {
        spinner.fail(chalk.red.bold(message ?? curMessage));
    }
    else if (type === 'warn')
    {
        spinner.warn(chalk.yellow.bold(message ?? curMessage));
    }
    else if (type === 'success')
    {
        spinner.succeed(chalk.green.bold(message ?? curMessage));
    }
    else if (type === 'info')
    {
        spinner.info(chalk.blue.bold(message ?? curMessage));
    }

    lineCount++;
}

export function updateSpinner(message: string)
{
    spinner.text = `${message}\n`;
    if (!spinner.isSpinning)
    {
        spinner.start();
    }
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
