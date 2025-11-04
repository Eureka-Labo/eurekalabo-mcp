#!/usr/bin/env node

/**
 * User Prompt Submit Hook
 * Runs when user submits a prompt
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
  const userPrompt = hookInput.prompt || '';
  const messages = [];

  // Detect infrastructure configuration changes
  if (/traefik|nginx|apache|docker|kubernetes/i.test(userPrompt)) {
    messages.push('🔍 INFRASTRUCTURE DETECTED: Consulting official documentation required');
    messages.push('🚨 REMINDER: All configuration changes must be validated against official docs');
  }

  // Detect production operations
  if (/production|prod|deploy|release/i.test(userPrompt)) {
    messages.push('⚠️ PRODUCTION OPERATION: Extra validation required');
    messages.push('🛡️ Remember to run --validate flag');
  }

  // Suggest flags for complex operations
  if (/analyze|investigate|debug|complex/i.test(userPrompt)) {
    messages.push('💡 SUGGESTION: Consider using --think or --ultrathink for deep analysis');
  }

  if (messages.length > 0) {
    console.log(messages.join('\n'));
  }

  process.exit(0);
}
