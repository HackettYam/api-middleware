#!/usr/bin/env node

/**
 * Git Workflow Management Script
 *
 * Usage:
 *   node scripts/git/index.js <command> [options]
 *
 * Commands:
 *   feature <subcommand>     - Feature branch management
 *     start <name>          - Start a new feature branch
 *     finish <branch>       - Finish a feature branch and merge into develop
 *
 *   hotfix <subcommand>      - Hotfix branch management
 *     start <name>          - Start a new hotfix branch from main
 *     prepare <branch>      - Prepare a hotfix for release
 */

const child_process = require('child_process');
// Import utility functions from common.js file
const {
  executeCommand,
  getPackageVersion,
  logSection,
  validateRequired,
} = require('../utils/common');

const execSync = child_process.execSync;

/**
 * Validates that the base branch is up to date with remote
 * @param {string} branchName Name of the branch to validate
 * @returns {boolean} true if validation is successful
 */
function validateBranchIsUpToDate(branchName) {
  console.log('Updating remote branches...');
  executeCommand('git fetch --all');

  console.log(`Checking if branch ${branchName} is up-to-date...`);
  const behindCount = executeCommand(
    `git rev-list --count ${branchName}..origin/${branchName} 2>/dev/null`,
    { encoding: 'utf-8' }
  ).trim();
  const countNum = parseInt(behindCount);

  executeCommand(`git checkout ${branchName}`);
  if (countNum > 0) {
    console.warn(
      `\nWarning: Branch ${branchName} is ${behindCount} commits behind origin/${branchName}.`
    );
    console.log(`Automatically updating branch ${branchName}...`);

    // Automatically pull the latest changes
    executeCommand(`git pull origin ${branchName}`);
    console.log(`Branch ${branchName} has been updated successfully.`);

    // Return to previous state (optional in the future)
    // For now we stay on the branch we just updated
  } else {
    console.log(`Branch ${branchName} is up-to-date.`);
  }

  return true;
}

/**
 * Validates that there are no pending changes in the working directory
 * @returns {boolean} true if the working directory is clean
 */
function validateNoUncommittedChanges() {
  console.log('Checking for uncommitted changes...');
  const status = executeCommand('git status --porcelain', { encoding: 'utf-8' }).trim();

  if (status) {
    console.error('\nError: You have uncommitted changes in your working directory.');
    console.log('\nChanges detected:');
    executeCommand('git status --short', { silent: true });
    console.log('\nPlease commit or stash your changes before proceeding.');
    process.exit(1);
  }

  console.log('Working directory is clean.');
  return true;
}

/**
 * Validates that a branch does not already exist locally or remotely
 * @param {string} branchName Full branch name to validate (e.g. feature/my-feature)
 * @returns {boolean} true if the branch does not exist
 */
function validateBranchDoesNotExist(branchName) {
  console.log(`Checking if branch ${branchName} already exists...`);

  // Check if branch exists locally
  try {
    const localBranches = execSync('git branch --list', { encoding: 'utf-8' }).trim();
    const branchExists = localBranches
      .split('\n')
      .map(branch => branch.trim().replace('* ', ''))
      .some(branch => branch === branchName);

    if (branchExists) {
      console.log(`\nError: Branch '${branchName}' already exists locally.`);
      console.log('Please choose a different name or delete the existing branch.');
      process.exit(1);
    }
  } catch (error) {
    console.log('Could not check local branches. Continuing...');
  }

  // Check if branch exists remotely
  try {
    const remoteBranches = execSync('git ls-remote --heads origin', { encoding: 'utf-8' }).trim();
    const branchExists = remoteBranches
      .split('\n')
      .map(branch => branch.trim().split('\t')[1])
      .filter(branch => branch)
      .map(branch => branch.replace('refs/heads/', ''))
      .some(branch => branch === branchName);

    if (branchExists) {
      console.log(`\nError: Branch '${branchName}' already exists remotely.`);
      console.log('Please choose a different name or delete the existing branch.');
      process.exit(1);
    }
  } catch (error) {
    console.log('Could not check remote branches. Continuing...');
  }

  console.log(`Branch ${branchName} does not exist.`);
  return true;
}

// Feature branch management functions
const feature = {
  /**
   * Start a new feature branch
   * @param {string} name Feature name
   */
  start: name => {
    validateRequired(name, 'Feature name');
    logSection(`Starting new feature: ${name}`);

    // Validate that there are no uncommitted changes
    validateNoUncommittedChanges();

    // Validate that develop is up-to-date
    validateBranchIsUpToDate('develop');

    // Validate that the new branch doesn't already exist
    validateBranchDoesNotExist(`feature/${name}`);

    executeCommand(`git checkout -b feature/${name}`);
    console.log(`\nFeature branch 'feature/${name}' created from 'develop'`);
  },

  /**
   * Finish a feature branch and merge it into develop
   * @param {string} branch Branch name
   */
  finish: branch => {
    validateRequired(branch, 'Branch name');

    logSection(`Finishing feature: ${branch}`);

    // Validate that there are no uncommitted changes
    validateNoUncommittedChanges();

    // Validate that develop is up-to-date
    validateBranchIsUpToDate('develop');

    // Validate that the branch to be merged exists
    try {
      const branchExists = execSync(`git rev-parse --verify ${branch}`, {
        stdio: 'pipe',
        encoding: 'utf-8',
      }).trim();
      if (!branchExists) {
        console.log(`\nError: Branch '${branch}' does not exist.`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`\nError: Branch '${branch}' does not exist.`);
      process.exit(1);
    }

    executeCommand('git checkout develop');
    executeCommand(`git merge --no-ff ${branch}`);
    console.log(`\nFeature branch '${branch}' merged into 'develop'`);
  },
};

// Hotfix branch management functions
const hotfix = {
  /**
   * Start a new hotfix branch from main
   * @param {string} name Hotfix name
   */
  start: name => {
    validateRequired(name, 'Hotfix name');

    logSection(`Starting new hotfix: ${name}`);

    // Validate that there are no uncommitted changes
    validateNoUncommittedChanges();

    // Validate that main is up-to-date
    validateBranchIsUpToDate('main');

    // Validate that the new branch doesn't already exist
    validateBranchDoesNotExist(`hotfix/${name}`);

    executeCommand(`git checkout -b hotfix/${name}`);
    console.log(`\nHotfix branch 'hotfix/${name}' created from 'main'`);
  },

  /**
   * Prepare a hotfix for release
   * @param {string} branch Branch name
   */
  prepare: branch => {
    validateRequired(branch, 'Branch name');

    const version = getPackageVersion();
    logSection(`Preparing hotfix ${branch} for release`);

    // Validate that there are no uncommitted changes
    validateNoUncommittedChanges();

    // Validate that main is up-to-date
    validateBranchIsUpToDate('main');

    // Validate that the branch to be merged exists
    try {
      const branchExists = execSync(`git rev-parse --verify ${branch}`, {
        stdio: 'pipe',
        encoding: 'utf-8',
      }).trim();
      if (!branchExists) {
        console.log(`\nError: Branch '${branch}' does not exist.`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`\nError: Branch '${branch}' does not exist.`);
      process.exit(1);
    }

    // Validate that the new hotfix release branch doesn't already exist
    validateBranchDoesNotExist(`release/${version}-hotfix`);

    executeCommand(`git checkout -b release/${version}-hotfix`);
    executeCommand(`git merge --no-ff ${branch}`);
    console.log(`\nHotfix branch '${branch}' merged into 'release/${version}-hotfix'`);
  },
};

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = args.slice(1);

// Command router
const [subcommand, ...subOptions] = options;

switch (command) {
  case 'feature':
    switch (subcommand) {
      case 'start':
        feature.start(subOptions[0]);
        break;
      case 'finish':
        feature.finish(subOptions[0]);
        break;
      default:
        console.log(`
Feature Branch Management

Usage:
  node scripts/git/index.js feature <subcommand> [options]

Subcommands:
  start <name>     - Start a new feature branch
  finish <branch>  - Finish a feature branch and merge into develop
        `);
        break;
    }
    break;

  case 'hotfix':
    switch (subcommand) {
      case 'start':
        hotfix.start(subOptions[0]);
        break;
      case 'prepare':
        hotfix.prepare(subOptions[0]);
        break;
      default:
        console.log(`
Hotfix Branch Management

Usage:
  node scripts/git/index.js hotfix <subcommand> [options]

Subcommands:
  start <name>     - Start a new hotfix branch from main
  prepare <branch> - Prepare a hotfix for release
        `);
        break;
    }
    break;

  default:
    console.log(`
Git Workflow Management Script

Usage:
  node scripts/git/index.js <command> [options]

Commands:
  feature <subcommand>     - Feature branch management
    start <name>          - Start a new feature branch
    finish <branch>       - Finish a feature branch and merge into develop
  
  hotfix <subcommand>      - Hotfix branch management
    start <name>          - Start a new hotfix branch from main
    prepare <branch>      - Prepare a hotfix for release
    `);
    break;
}
