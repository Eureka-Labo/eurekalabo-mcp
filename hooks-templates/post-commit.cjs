#!/usr/bin/env node

/**
 * Post-Commit Hook
 * Runs after successful git commits
 */

const { execSync } = require('child_process');

let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(inputData);
    processHook(hookInput);
  } catch (error) {
    // Fail open on parse error
    process.exit(0);
  }
});

function processHook(hookInput) {
  const { tool_name } = hookInput;

  // Only run for Bash tool with git commit commands
  if (tool_name !== 'Bash') {
    process.exit(0);
    return;
  }

  const command = hookInput.tool_input?.command || '';
  if (!command.includes('git commit')) {
    process.exit(0);
    return;
  }

  try {
    const commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

    console.log(`✅ Commit successful: ${commitHash}`);
    console.log(`📝 Message: ${commitMsg}`);

    // Try to log commit to Eureka Tasks if available
    try {
      execSync(`eurekaclaude tasks log-commit ${commitHash}`, { stdio: 'ignore' });
    } catch (error) {
      // eurekaclaude not available, skip
    }
  } catch (error) {
    // Git command failed, skip
  }

  process.exit(0);
}
