// Integration tests with Jest + Typia. Real API (no mocks). Load .env.test for credentials.
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/integration/**/*.integration.test.ts',
        '**/.integration/**/*.integration.test.ts',
        '**/.integration/**/*.test.ts',
    ],
    transform: { '^.+\\.ts$': 'ts-jest' },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.test.json',
        },
    },
    moduleNameMapper: {
        '^@rachelallyson/planning-center-base-ts$': '<rootDir>/../planning-center-base-ts',
    },
    setupFilesAfterEnv: ['<rootDir>/tests/integration-setup.ts'],
    testTimeout: 60000,
};


