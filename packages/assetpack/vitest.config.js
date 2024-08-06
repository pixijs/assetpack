import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        poolOptions: {
            threads: {
                // Due to the cpu-features and vitest threads incompatibility, see:
                // https://github.com/vitest-dev/vitest/issues/1982
                // https://github.com/vitest-dev/vitest/issues/740
                singleThread: true
            },
        },
        // ...
    },
});
