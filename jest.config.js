module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/src/', '/dist/'],
    testTimeout: 300000,
    moduleNameMapper: {
        '^@assetpack/plugin-(.*)$': '<rootDir>/packages/$1/src',
        '^@assetpack/(.*)$': '<rootDir>/packages/$1/src',
    },
    setupFilesAfterEnv: ['jest-extended/all']
};
