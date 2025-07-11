/* eslint-disable no-console */
import { spawn } from './spawn.mjs';

/**
 * Publish the package to npm with a specific tag
 */
const publish = async () => {
    try {
        const tag = process.env.PUBLISH_TAG;

        if (!tag) {
            throw new Error('PUBLISH_TAG environment variable is not set. Please provide a tag to publish with.');
        }

        console.log(`Publishing with tag: ${tag}`);
        await spawn('npm', ['publish', '--tag', tag]);
        console.log(`✅ Package published successfully with tag: ${tag}`);
    } catch (error) {
        console.error('❌ Package publish failed:', error.message);
        process.exit(1);
    }
};

await publish();
