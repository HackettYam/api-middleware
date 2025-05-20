#!/usr/bin/env node

/**
 * Script to validate that integration is being performed from a hotfix/ branch
 * This script prevents unauthorized integrations to the main branch
 */

const { execSync } = require('child_process');

try {
  // Get current branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  
  // Check if we are on a hotfix branch
  if (!currentBranch.startsWith('hotfix/')) {
    console.error('\x1b[31mERROR: Only branches of type "hotfix/*" can be integrated directly into main.\x1b[0m');
    console.error('\x1b[33mYou are trying to integrate from branch: ' + currentBranch + '\x1b[0m');
    console.error('\x1b[33mPlease create a hotfix branch using: pnpm hotfix:start\x1b[0m');
    process.exit(1);
  }
  
  // Verify that there are no uncommitted changes
  const status = execSync('git status --porcelain').toString().trim();
  if (status !== '') {
    console.error('\x1b[31mERROR: There are uncommitted changes in your branch\x1b[0m');
    console.error('\x1b[33mPlease commit all changes before finishing the hotfix\x1b[0m');
    process.exit(1);
  }
  
  console.log('\x1b[32mSuccessful validation: The hotfix branch is ready to be integrated into main\x1b[0m');
} catch (error) {
  console.error('\x1b[31mERROR during validation: ' + error.message + '\x1b[0m');
  process.exit(1);
}
