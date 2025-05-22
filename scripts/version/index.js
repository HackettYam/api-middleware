#!/usr/bin/env node

/**
 * Version Management Script
 *
 * Usage:
 *   node scripts/version/index.js <command> [options]
 *
 * Commands:
 *   minor     - Bump minor version
 *   major     - Bump major version
 *   patch     - Bump patch version
 *   changelog - Generate changelog only
 *   tag       - Create version tag only
 */

const { executeCommand, getPackageVersion } = require('../utils/common');

// Command line arguments
const command = process.argv[2];

// Command handlers
/**
 * Bump package version
 * @param {string} type Version type: 'minor', 'major', or 'patch'
 * @returns {string} New version
 */
function bumpVersion(type) {
  console.log(`Bumping ${type} version...`);
  executeCommand(
    `npx standard-version --release-as ${type} --skip.changelog --skip.commit --skip.tag`
  );
  const newVersion = getPackageVersion();
  console.log(`Version updated to ${newVersion}`);
  return newVersion;
}

/**
 * Generate changelog without changing version
 */
function generateChangelog() {
  console.log('Generating changelog...');
  executeCommand('npx standard-version --skip.bump --skip.tag --skip.commit');
  console.log('Changelog generated');
}

/**
 * Create version tag
 */
function createVersionTag() {
  console.log('Creating version tag...');
  executeCommand('npx standard-version --skip.bump --skip.changelog');
  console.log('Version tag created');
}

// Command router
switch (command) {
  case 'minor':
    bumpVersion('minor');
    break;
  case 'major':
    bumpVersion('major');
    break;
  case 'patch':
    bumpVersion('patch');
    break;
  case 'changelog':
    generateChangelog();
    break;
  case 'tag':
    createVersionTag();
    break;
  default:
    console.log(`
Version Management Script

Usage:
  node scripts/version/index.js <command> [options]

Commands:
  minor     - Bump minor version
  major     - Bump major version
  patch     - Bump patch version
  changelog - Generate changelog only
  tag       - Create version tag only
    `);
    break;
}
