module.exports = {
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/types/**/*.ts', // Exclude type definitions from coverage
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    preset: 'ts-jest',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    testPathIgnorePatterns: ['/node_modules/', '/integration/'],
    testTimeout: 10000,
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    moduleNameMapper: {
        '^ky$': '<rootDir>/../planning-center-base-ts/tests/__mocks__/ky.ts',
        '^@badgateway/oauth2-client$': '<rootDir>/../planning-center-base-ts/tests/__mocks__/oauth2-client.ts',
    },
    // Thresholds set to current coverage; raise as unit tests are added.
    coverageThreshold: {
        global: { statements: 59, branches: 44, functions: 24, lines: 59 },
    },
    verbose: true,
};

