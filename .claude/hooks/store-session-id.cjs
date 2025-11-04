#!/usr/bin/env node

/**
 * Claude Code Session ID Storage Hook
 *
 * This hook stores the Claude Code session ID to a file so the MCP server
 * can track which Claude Code session a work session belongs to.
 */

const fs = require('fs');
const path = require('path');

// Read hook input from stdin
let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(inputData);
    processHook(hookInput);
  } catch (error) {
    // If we can't parse input, just exit (fail silently)
    process.exit(0);
  }
});

function processHook(hookInput) {
  const { session_id, cwd } = hookInput;

  // Only proceed if we have both session_id and cwd
  if (!session_id || !cwd) {
    process.exit(0);
    return;
  }

  try {
    const sessionIdPath = path.join(cwd, '.claude-session-id');
    fs.writeFileSync(sessionIdPath, session_id, 'utf8');
  } catch (error) {
    // Silently fail - this is a best-effort operation
    console.error('[Session ID Storage] Failed to store session ID:', error.message);
  }

  process.exit(0);
}
