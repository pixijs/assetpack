const sharedConfig = require('../../jest.config');

module.exports = {
    ...sharedConfig,
    rootDir: './',
    moduleNameMapper: {
        '^@assetpack/(.*)$': '<rootDir>/../$1/src',
    },
};
