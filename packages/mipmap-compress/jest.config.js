const sharedConfig = require('../../jest.config');

module.exports = {
    ...sharedConfig,
    rootDir: './',
    moduleNameMapper: {
        '^@assetpack/plugin-(.*)$': '<rootDir>/../$1/src',
        '^@assetpack/(.*)$': '<rootDir>/../$1/src',
    },
};
