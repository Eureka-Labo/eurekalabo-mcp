#!/usr/bin/env node

/**
 * Pre-Edit Hook
 * Runs before any file edit operation
 */

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
  const { tool_input } = hookInput;
  const filePath = tool_input?.file_path || '';

  // Block production config files
  if (filePath.includes('production.config')) {
    const response = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: '❌ BLOCKED: Cannot edit production config files'
      }
    };
    console.log(JSON.stringify(response));
    process.exit(0);
    return;
  }

  // Warn about lock files
  if (filePath.includes('package-lock.json') || filePath.includes('yarn.lock')) {
    const response = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: '⚠️ WARNING: Editing lock file - ensure this is intentional'
      },
      suppressOutput: false
    };
    console.log(JSON.stringify(response));
    process.exit(0);
    return;
  }

  // Allow by default
  process.exit(0);
}
