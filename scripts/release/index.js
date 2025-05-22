#!/usr/bin/env node

/**
 * Release Workflow Management Script
 *
 * Usage:
 *   node scripts/release/index.js <command> [options]
 *
 * Commands:
 *   prepare                  - Prepare a release branch with current version
 *   start <type>             - Update version and create release branch (type: minor|major|patch)
 *   finish                   - Finish a release branch and merge into main
 *   validate                 - Validate that the current version doesn't exist as a tag
 *   revert <version>         - Revert a release (removes tags and resets main branch)
 */

const path = require('path');
const child_process = require('child_process');
const {
  executeCommand,
  getPackageVersion,
  validateRequired,
  logSection,
} = require('../utils/common');

const execSync = child_process.execSync;

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = args.slice(1);

/**
 * Check if a git tag exists for the specified version
 * @param {string} version Version to check
 * @returns {boolean} True if tag exists, false otherwise
 */
function tagExists(version) {
  try {
    const result = execSync(`git tag -l "v${version}"`, { encoding: 'utf-8' }).trim();
    return result.length > 0;
  } catch {
    return false;
  }
}

/**
 * Validate the current version
 * @returns {boolean} True if valid, false otherwise
 */
function validateVersion() {
  const version = getPackageVersion();

  // Check if version tag already exists
  if (tagExists(version)) {
    console.error(`ERROR: Version v${version} already exists as a git tag.`);
    return false;
  }

  // Check if version follows semver pattern
  const semverPattern =
    /^(\d+)\.(\d+)\.(\d+)(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/;
  if (!semverPattern.test(version)) {
    console.error(`ERROR: Version ${version} is not a valid semantic version.`);
    return false;
  }

  console.log(`Version v${version} is valid and doesn't exist as a tag.`);
  return true;
}

/**
 * Prepare a release branch with the current version
 */
function prepare() {
  const version = getPackageVersion();

  // Validate version before creating the branch
  if (!validateVersion()) {
    process.exit(1);
  }

  logSection(`Preparing release for version ${version}`);
  executeCommand('git checkout develop');
  executeCommand(`git checkout -b release/${version}`);
  console.log(`\nRelease branch 'release/${version}' created from 'develop'`);
}

/**
 * Start a new release with version bump
 * @param {string} type Version bump type
 */
function start(type) {
  validateRequired(type, 'Version type');

  if (!['minor', 'major', 'patch'].includes(type)) {
    console.error('Error: Version type must be one of: minor, major, patch');
    process.exit(1);
  }

  logSection(`Starting new release with ${type} version bump`);

  // First update the version - using the JS version now instead of TS
  executeCommand(`node ${path.resolve(__dirname, '../version/index.js')} ${type}`);

  // Validate the new version
  if (!validateVersion()) {
    process.exit(1);
  }

  // Then create the release branch
  const version = getPackageVersion();
  executeCommand('git checkout develop');
  executeCommand(`git checkout -b release/${version}`);
  console.log(`\nRelease branch 'release/${version}' created with updated version`);
}

/**
 * Finish a release
 */
function finish() {
  const version = getPackageVersion();

  // Validate the version before finishing
  if (!validateVersion()) {
    process.exit(1);
  }

  logSection(`Finishing release for version ${version}`);

  // Merge release branch to main
  executeCommand('git checkout main');
  executeCommand(`git merge --no-ff release/${version}`);

  // Generate changelog and create tag - using the JS version now instead of TS
  executeCommand(`node ${path.resolve(__dirname, '../version/index.js')} changelog`);
  executeCommand(`node ${path.resolve(__dirname, '../version/index.js')} tag`);

  // Merge back to develop
  executeCommand('git checkout develop');
  executeCommand('git merge --no-ff main');

  console.log(`\nRelease ${version} completed and merged into 'main' and 'develop'`);
}

/**
 * Validate the current version
 */
function validate() {
  logSection('Validating current version');
  validateVersion();
}

/**
 * Revert a release
 * @param {string} version Version to revert
 */
function revert(version) {
  validateRequired(version, 'Version');

  logSection(`Reverting release ${version}`);

  // Check if the tag exists
  if (!tagExists(version)) {
    console.error(`ERROR: Tag v${version} does not exist.`);
    process.exit(1);
  }

  // Confirm with the user
  console.log(
    `WARNING: This will remove the tag v${version} and reset the main branch to the state before the release.`
  );
  console.log('Make sure you understand the implications before proceeding.');
  console.log(
    'To proceed, run this command with --confirm: pnpm release:revert <version> --confirm'
  );

  // Check for confirmation flag
  if (options.includes('--confirm')) {
    // Delete the tag
    executeCommand(`git tag -d v${version}`);

    // Find the commit before the tag
    const previousCommit = execSync(`git rev-list -n 1 v${version}~1`, {
      encoding: 'utf-8',
    }).trim();

    // Reset main branch
    executeCommand('git checkout main');
    executeCommand(`git reset --hard ${previousCommit}`);

    console.log(`\nRelease v${version} has been reverted.`);
    console.log('The tag has been removed and main branch has been reset.');
    console.log('You may need to force push these changes and notify your team.');
  }
}

// Command router
switch (command) {
  case 'prepare':
    prepare();
    break;
  case 'start':
    start(options[0]);
    break;
  case 'finish':
    finish();
    break;
  case 'validate':
    validate();
    break;
  case 'revert':
    revert(options[0]);
    break;
  default:
    console.log(`
Release Workflow Management Script

Usage:
  node scripts/release/index.js <command> [options]

Commands:
  prepare                  - Prepare a release branch with current version
  start <type>             - Update version and create release branch (type: minor|major|patch)
  finish                   - Finish a release branch and merge into main
  validate                 - Validate that the current version doesn't exist as a tag
  revert <version>         - Revert a release (removes tags and resets main branch)
                             Use with --confirm to execute
    `);
    break;
}
