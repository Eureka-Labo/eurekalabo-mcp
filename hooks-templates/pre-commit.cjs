#!/usr/bin/env node

/**
 * Pre-Commit Hook
 * Runs before git commit operations
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

  let warnings = [];

  // Run tests if package.json exists
  try {
    const fs = require('fs');
    if (fs.existsSync('package.json')) {
      try {
        execSync('npm run test --if-present', { stdio: 'ignore' });
        console.log('✅ Tests passed');
      } catch (error) {
        const response = {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: '❌ BLOCKED: Tests failed - fix before committing'
          }
        };
        console.log(JSON.stringify(response));
        process.exit(0);
        return;
      }
    }
  } catch (error) {
    // Skip test check if error
  }

  // Check for debugging code
  try {
    const diff = execSync('git diff --cached', { encoding: 'utf8' });
    if (/console\.log|debugger|TODO:|FIXME:/.test(diff)) {
      warnings.push('⚠️ WARNING: Found debugging code or TODOs in commit');
    }

    // Check for secrets
    if (/(api_key|password|secret|token).*=.*['"]/i.test(diff)) {
      const response = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: '❌ BLOCKED: Potential secrets detected in commit'
        }
      };
      console.log(JSON.stringify(response));
      process.exit(0);
      return;
    }
  } catch (error) {
    // Skip diff check if error
  }

  if (warnings.length > 0) {
    console.log(warnings.join('\n'));
  }

  process.exit(0);
}
