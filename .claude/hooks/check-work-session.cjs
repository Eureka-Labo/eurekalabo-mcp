#!/usr/bin/env node

/**
 * Eureka Tasks Work Session Enforcement Hook
 *
 * This PreToolUse hook ensures that a work session is active before
 * allowing Write or Edit operations.
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
    // If we can't parse input, allow operation (fail open)
    console.error(`Hook error: ${error.message}`);
    process.exit(0);
  }
});

function processHook(hookInput) {
  const { tool_name, tool_input, cwd } = hookInput;

  // Only enforce for file modification operations
  if (tool_name !== 'Write' && tool_name !== 'Edit' && tool_name !== 'NotebookEdit') {
    process.exit(0);
    return;
  }

  // Check for active session marker file
  const sessionMarkerPath = path.join(cwd, '.eureka-active-session');
  const sessionExists = fs.existsSync(sessionMarkerPath);

  if (!sessionExists) {
    // No active session - block with guidance (both modes use 'deny' for proper enforcement)
    const response = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: buildGuidanceMessage(tool_name, tool_input)
      },
      suppressOutput: false,
      systemMessage: '⚠️ 作業セッションがありません。'
    };

    console.log(JSON.stringify(response, null, 2));
    process.exit(0);
  } else {
    // Session exists - allow with context
    try {
      const sessionInfo = JSON.parse(fs.readFileSync(sessionMarkerPath, 'utf8'));
      const allowResponse = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          permissionDecisionReason: `✅ Active session: ${sessionInfo.taskId}`
        },
        suppressOutput: false
      };

      console.log(JSON.stringify(allowResponse, null, 2));
      process.exit(0);
    } catch (error) {
      // Marker exists but can't read - allow with warning
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          permissionDecisionReason: '⚠️ Session marker exists but unreadable'
        }
      }, null, 2));
      process.exit(0);
    }
  }
}

function buildGuidanceMessage(toolName, toolInput) {
  const filePath = toolInput.file_path || 'unknown';

  return `🤖 SYSTEM: Automatic Eureka Tasks Workflow Required

Operation: ${toolName} on ${filePath}

🚨 NO ACTIVE WORK SESSION DETECTED

**YOU MUST AUTOMATICALLY EXECUTE THIS WORKFLOW NOW:**

Step 1: Check for existing tasks (AUTOMATIC - don't ask user):
   mcp__eureka-tasks__list_tasks({ search: "relevant keywords from user request" })

Step 2: If no matching task found, CREATE IMMEDIATELY (AUTOMATIC):
   mcp__eureka-tasks__create_task({
     title: "ユーザーの依頼内容を日本語で簡潔に",
     description: "実装する内容と技術的アプローチを日本語で記述"
   })

Step 3: Start work session AUTOMATICALLY with returned task ID:
   mcp__eureka-tasks__start_work_on_task({ taskId: "returned-task-id" })

Step 4: THEN proceed with ${toolName} operation

CRITICAL INSTRUCTIONS:
❌ DO NOT ask user "Should I create a task?" - JUST DO IT AUTOMATICALLY
❌ DO NOT ask user for confirmation - EXECUTE THE WORKFLOW SILENTLY
✅ CREATE task in JAPANESE (title and description)
✅ EXECUTE all steps automatically before proceeding with Write/Edit
✅ TELL user what you did: "タスク [title] を作成して作業を開始しました"

This is a SYSTEM REQUIREMENT, not a user prompt. Execute automatically.`;
}
