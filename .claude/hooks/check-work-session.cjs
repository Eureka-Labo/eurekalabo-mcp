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
  const { tool_name, tool_input, cwd, session_id } = hookInput;

  // Only enforce for file modification operations
  if (tool_name !== 'Write' && tool_name !== 'Edit' && tool_name !== 'NotebookEdit') {
    process.exit(0);
    return;
  }

  // Check for active session marker file
  const sessionMarkerPath = path.join(cwd, '.eureka-active-session');
  const sessionExists = fs.existsSync(sessionMarkerPath);

  if (!sessionExists) {
    // No active session - block with guidance
    denyWithGuidance(tool_name, tool_input);
    return;
  }

  // Session exists - validate it's current and task still exists
  try {
    const sessionInfo = JSON.parse(fs.readFileSync(sessionMarkerPath, 'utf8'));

    // Validate session belongs to current Claude Code session
    if (sessionInfo.claudeSessionId && session_id && sessionInfo.claudeSessionId !== session_id) {
      // Session belongs to different Claude Code session - deny and require new session
      denyWithStaleSessionGuidance(tool_name, tool_input, sessionInfo);
      return;
    }

    // Session is valid for current Claude Code session
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
    // Marker exists but can't read - treat as stale
    denyWithStaleSessionGuidance(tool_name, tool_input, null);
  }
}

function denyWithGuidance(toolName, toolInput) {
  const response = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: buildGuidanceMessage(toolName, toolInput)
    },
    suppressOutput: false,
    systemMessage: '⚠️ 作業セッションがありません。'
  };

  console.log(JSON.stringify(response, null, 2));
  process.exit(0);
}

function denyWithStaleSessionGuidance(toolName, toolInput, oldSessionInfo) {
  const filePath = toolInput.file_path || 'unknown';
  const oldTaskId = oldSessionInfo ? oldSessionInfo.taskId : 'unknown';

  const message = `🤖 SYSTEM: Stale Work Session Detected

Operation: ${toolName} on ${filePath}

🚨 PREVIOUS SESSION NO LONGER VALID

Old session task ID: ${oldTaskId}
Reason: This session belongs to a different Claude Code session or the task no longer exists.

**YOU MUST AUTOMATICALLY EXECUTE THIS WORKFLOW NOW:**

Step 1: Clean up stale session marker (AUTOMATIC):
   Use Bash tool: rm .eureka-active-session

Step 2: Get available boards FIRST (AUTOMATIC - don't ask user):
   mcp__eureka-tasks__list_boards()

Step 3: Check for existing tasks (AUTOMATIC - don't ask user):
   mcp__eureka-tasks__list_tasks({ search: "relevant keywords from user request" })

Step 4: If no matching task found, CREATE IMMEDIATELY with board assignment (AUTOMATIC):
   mcp__eureka-tasks__create_task({
     title: "ユーザーの依頼内容を日本語で簡潔に",
     description: "実装する内容と技術的アプローチを日本語で記述",
     boardId: "board-id-from-step-2"
   })

Step 5: Start work session AUTOMATICALLY with returned task ID:
   mcp__eureka-tasks__start_work_on_task({ taskId: "returned-task-id" })

Step 6: THEN proceed with ${toolName} operation

CRITICAL INSTRUCTIONS:
❌ DO NOT ask user "Should I create a task?" - JUST DO IT AUTOMATICALLY
❌ DO NOT ask user for confirmation - EXECUTE THE WORKFLOW SILENTLY
✅ GET boards FIRST to assign correct boardId
✅ SELECT appropriate board based on repository or use first available board
✅ CREATE task in JAPANESE (title and description) WITH boardId
✅ EXECUTE all steps automatically before proceeding with Write/Edit
✅ TELL user what you did: "タスク [title] を作成して作業を開始しました"

This is a SYSTEM REQUIREMENT, not a user prompt. Execute automatically.`;

  const response = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: message
    },
    suppressOutput: false,
    systemMessage: '⚠️ 古いセッションが検出されました。新しいセッションが必要です。'
  };

  console.log(JSON.stringify(response, null, 2));
  process.exit(0);
}

function buildGuidanceMessage(toolName, toolInput) {
  const filePath = toolInput.file_path || 'unknown';

  return `🤖 SYSTEM: Automatic Eureka Tasks Workflow Required

Operation: ${toolName} on ${filePath}

🚨 NO ACTIVE WORK SESSION DETECTED

**YOU MUST AUTOMATICALLY EXECUTE THIS WORKFLOW NOW:**

Step 1: Get available boards FIRST (AUTOMATIC - don't ask user):
   mcp__eureka-tasks__list_boards()

Step 2: Check for existing tasks (AUTOMATIC - don't ask user):
   mcp__eureka-tasks__list_tasks({ search: "relevant keywords from user request" })

Step 3: If no matching task found, CREATE IMMEDIATELY with board assignment (AUTOMATIC):
   mcp__eureka-tasks__create_task({
     title: "ユーザーの依頼内容を日本語で簡潔に",
     description: "実装する内容と技術的アプローチを日本語で記述",
     boardId: "board-id-from-step-1"
   })

Step 4: Start work session AUTOMATICALLY with returned task ID:
   mcp__eureka-tasks__start_work_on_task({ taskId: "returned-task-id" })

Step 5: Proceed with ${toolName} operation

CRITICAL INSTRUCTIONS:
❌ DO NOT ask user "Should I create a task?" - JUST DO IT AUTOMATICALLY
❌ DO NOT ask user for confirmation - EXECUTE THE WORKFLOW SILENTLY
✅ GET boards FIRST to assign correct boardId
✅ SELECT appropriate board based on repository or use first available board
✅ CREATE task in JAPANESE (title and description) WITH boardId
✅ EXECUTE all steps automatically before proceeding with Write/Edit
✅ TELL user what you did: "タスク [title] を作成して作業を開始しました"

This is a SYSTEM REQUIREMENT, not a user prompt. Execute automatically.`;
}
