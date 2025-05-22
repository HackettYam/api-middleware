#!/usr/bin/env node

/**
 * Common utility functions for scripts
 * Provides shared functionality for git and version management scripts
 */

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Execute a shell command and handle errors
 * @param {string} cmd Command to execute
 * @param {Object} options Command options
 * @param {boolean} options.silent If true, won't log the command being executed
 * @returns {Buffer} Buffer containing command output
 */
function executeCommand(cmd, options = {}) {
  const execSync = child_process.execSync;
  const isUtf8 = options?.encoding === 'utf-8';
  const { silent, ...opts } = {
    stdio: isUtf8 ? 'pipe' : 'inherit',
    silent: false,
    ...options,
  };

  try {
    if (!silent) {
      console.log(`Executing: ${cmd}`);
    }
    return execSync(cmd, { ...opts });
  } catch (error) {
    console.error(`Error executing command: ${cmd}`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

/**
 * Get package version from package.json
 * @returns {string} Current version string
 */
function getPackageVersion() {
  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

/**
 * Format command output for display
 * @param {string} output Command output
 * @returns {string} Formatted string
 */
function formatOutput(output) {
  return output.trim();
}

/**
 * Log a section header to the console
 * @param {string} title Section title
 */
function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Validate that a required parameter is provided
 * @param {string|undefined} value Parameter value
 * @param {string} name Parameter name for error message
 */
function validateRequired(value, name) {
  if (!value) {
    console.error(`Error: ${name} is required`);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  executeCommand,
  getPackageVersion,
  formatOutput,
  logSection,
  validateRequired,
};
