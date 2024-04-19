const sharedConfig = require('../../jest.config');

module.exports = {
    ...sharedConfig,
    rootDir: './',
    moduleNameMapper: {
        '^@play-co/assetpack-plugin-(.*)$': '<rootDir>/../$1/src',
        '^@play-co/assetpack-(.*)$': '<rootDir>/../$1/src',
    },
};
