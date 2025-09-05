/* eslint-disable no-console */
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { bump } from './bump.mjs';
import { spawn } from './spawn.mjs';

const rootDir = process.cwd();

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object>} Parsed JSON object
 */
const readJsonFile = async (filePath) => {
    try {
        const content = await readFile(filePath, 'utf8');

        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
    }
};

/**
 * Write a JSON object to a file
 * @param {string} filePath - Path to write the file
 * @param {Object} data - Data to write
 */
const writeJsonFile = async (filePath, data) => {
    try {
        const content = `${JSON.stringify(data, null, 2)}\n`;

        await writeFile(filePath, content, 'utf8');
    } catch (error) {
        throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
    }
};

/**
 * Update package.json version
 * @param {string} packagePath - Path to package.json
 * @param {string} newVersion - New version to set
 */
const updatePackageVersion = async (packagePath, newVersion) => {
    const packageJson = await readJsonFile(packagePath);

    packageJson.version = newVersion;
    await writeJsonFile(packagePath, packageJson);
    console.log(`Updated ${packagePath} to version ${newVersion}`);
};

const updatePackageLockVersion = async (packageLockPath, newVersion) => {
    const packageLockJson = await readJsonFile(packageLockPath);

    if (packageLockJson['packages/assetpack']) {
        packageLockJson['packages/assetpack'].version = newVersion;
    }

    await writeJsonFile(packageLockPath, packageLockJson);
    console.log(`Updated ${packageLockPath} to version ${newVersion}`);
};

/**
 * Bump the version of the package and update all relevant package.json files
 * @returns {Promise<string>} The next version
 */
const version = async () => {
    try {
        // Read current version from root package.json
        const rootPackagePath = join(rootDir, 'package.json');
        const packageJson = await readJsonFile(rootPackagePath);
        const currentVersion = packageJson.version;

        console.log(`Current version: ${currentVersion}`);

        // Calculate next version
        const nextVersion = await bump(currentVersion);

        console.log(`Next version: ${nextVersion}`);

        // Update assetpack package.json
        const assetpackPackagePath = join(rootDir, 'packages', 'assetpack', 'package.json');
        const assetpackPackageLockPath = join(rootDir, 'package-lock.json');

        // Update root package.json using npm version command
        console.log('Updating assetpack package.json...');
        await updatePackageVersion(assetpackPackagePath, nextVersion);
        await updatePackageLockVersion(assetpackPackageLockPath, nextVersion);
        await spawn('git', ['add', '.']);
        await spawn('git', ['commit', '-m', `chore: bump version to ${nextVersion}`]);

        // Update root package.json using npm version command
        console.log('Updating root package.json...');
        await spawn('npm', ['version', nextVersion]);

        // push changes to git
        await spawn('git', ['push']);
        await spawn('git', ['push', '--tags']);

        console.log(`✅ Version bump completed: ${currentVersion} → ${nextVersion}`);
    } catch (error) {
        console.error('❌ Version bump failed:', error.message);
        process.exit(1);
    }
};

await version();
