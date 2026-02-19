import { resolve } from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import UnpluginTypia from '@ryoppippi/unplugin-typia/vite';

// Load .env.test (mode 'test') so PCO_PERSONAL_ACCESS_TOKEN etc. are available
const env = loadEnv('test', process.cwd(), '');

export default defineConfig({
    plugins: [
        // Typia transform must run so typia.assert<T>() works in integration tests
        UnpluginTypia({ tsconfig: resolve(__dirname, 'tsconfig.test.json') }),
    ],
    test: {
        include: ['tests/integration/**/*.integration.test.ts'],
        environment: 'node',
        globals: true,
        env,
        setupFiles: [resolve(__dirname, 'tests/integration-setup.ts')],
        testTimeout: 60000,
        pool: 'forks',
    },
    resolve: {
        alias: {
            '@rachelallyson/planning-center-base-ts': resolve(__dirname, '../planning-center-base-ts/src/index.ts'),
        },
    },
});
