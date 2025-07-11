/* eslint-disable no-console */
import { spawn } from './spawn.mjs';

async function publish() {
    try {
        const tag = process.env.XS_PUBLISH_TAG ?? 'latest';

        console.log(`Publishing with tag: ${tag}`);

        await spawn('npm', ['publish', '--tag', tag]);

        console.log(`✅ Package published successfully with tag: ${tag}`);
    } catch (error) {
        console.error('❌ Package publish failed:', error.message);
        process.exit(1);
    }
}

await publish();
