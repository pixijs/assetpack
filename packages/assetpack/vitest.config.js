import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        testTimeout: 10000,
        poolOptions: {
            forks: {
                singleFork: process.env.GITHUB_ACTIONS === 'true',
            },
        },
    },
});
