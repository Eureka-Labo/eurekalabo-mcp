#!/usr/bin/env node

/**
 * Post-Edit Hook
 * Runs after file edit operations
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
  const { tool_input } = hookInput;
  const filePath = tool_input?.file_path || '';

  let messages = [];

  // Auto-format TypeScript/JavaScript files
  if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
    try {
      execSync(`prettier --write "${filePath}"`, { stdio: 'ignore' });
      messages.push(`✅ Formatted: ${filePath}`);
    } catch (error) {
      // Prettier not installed or failed, skip
    }
  }

  // Run type check for TypeScript files
  if (/\.(ts|tsx)$/.test(filePath)) {
    try {
      const output = execSync('tsc --noEmit --skipLibCheck 2>&1 | head -20', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      if (output) {
        messages.push(`TypeScript check:\n${output}`);
      }
    } catch (error) {
      // TypeScript not installed or errors, skip
    }
  }

  if (messages.length > 0) {
    console.log(messages.join('\n'));
  }

  process.exit(0);
}
