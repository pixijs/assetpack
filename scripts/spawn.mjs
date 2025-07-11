import childProcess from 'node:child_process';
import path from 'node:path';

const projectPath = path.join(process.cwd());

/**
 * Utility to do spawn but as a Promise
 * @param {string} command - Command to run
 * @param {string[]} args - Arguments for the command
 * @param {Function} [onClose] - Function to run when the process closes or errors
 *        this is useful for cleaning up temporary files even if the process errors.
 */
export const spawn = (command, args, onClose) =>
    new Promise((resolve) => {
        const child = childProcess.spawn(command, args, {
            cwd: projectPath,
            stdio: 'inherit',
            // See https://nodejs.org/api/child_process.html#spawning-bat-and-cmd-files-on-windows
            shell: process.platform.startsWith('win'),
            env: process.env,
        });

        child.once('close', async (code) => {
            await onClose?.();

            if (code === 0) {
                resolve();
            } else {
                process.exit(code);
            }
        });
        child.once('error', async () => {
            await onClose?.();

            process.exit(1);
        });
    });
