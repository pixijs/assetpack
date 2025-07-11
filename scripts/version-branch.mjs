/* eslint-disable no-console */
import { spawn } from './spawn.mjs';

/**
 * Bump the version of the package
 */
const version = async () => {
    try {
        // Calculate next version
        const nextVersion = process.env.VERSION;

        if (!nextVersion) {
            throw new Error('VERSION environment variable is not set. Please provide a version to bump to.');
        }

        console.log(`Next version: ${nextVersion}`);
        // Update root package.json using npm version command
        console.log('Updating root package.json...');
        await spawn('npm', ['version', nextVersion, '--no-git-tag-version', '--force']);
        console.log(`✅ Version bump completed: ${nextVersion}`);
    } catch (error) {
        console.error('❌ Version bump failed:', error.message);
        process.exit(1);
    }
};

await version();
