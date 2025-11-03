module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/integration/**/*.integration.test.ts'
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/testing/**/*.ts',
        '!src/**/index.ts',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '^@rachelallyson/planning-center-base-ts$': '<rootDir>/node_modules/@rachelallyson/planning-center-base-ts',
    },
    setupFilesAfterEnv: ['<rootDir>/tests/integration-setup.ts'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],
    transformIgnorePatterns: [
        '/node_modules/(?!@rachelallyson/)'
    ],
    testTimeout: 60000
};


