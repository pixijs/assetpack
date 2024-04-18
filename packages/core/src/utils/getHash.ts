import { readFileSync } from 'fs-extra';

import { crc32 as calculateCrc32 } from '@node-rs/crc32';

/**
 * Get the hash of a file or buffer
 * @param input - The file path or buffer to hash
 * @returns The hash of the file or buffer
 */
export function getHash(input: string | Buffer): string
{
    if (typeof input === 'string')
    {
        input = readFileSync(input);
    }

    const checksumHex = calculateCrc32(input).toString(16);

    return Buffer.from(checksumHex, 'hex').toString('base64url');
}
