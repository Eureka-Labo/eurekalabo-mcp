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

**STEP 0: CLASSIFY REQUEST TYPE (MANDATORY FIRST STEP)**

Analyze user's request and determine:
- ✨ NEW FEATURE? → Workflow A (with feature spec)
- 🔧 MAINTENANCE? (bug fix/refactor) → Workflow B (task only)
- ❓ AMBIGUOUS? → ASK USER TO CLARIFY

**IF AMBIGUOUS: YOU MUST ASK:**
"Is this a new feature requiring a feature specification, or a maintenance task (bug fix/refactor)?"
WAIT for user response before proceeding.

---

**YOU MUST AUTOMATICALLY EXECUTE THIS WORKFLOW NOW:**

Step 1: Clean up stale session marker:
   Use Bash tool: rm .eureka-active-session

Step 2: Follow appropriate workflow based on classification:

**WORKFLOW A (NEW FEATURE):**
- start_feature_development → create_feature_spec → create_task → link_task_to_feature_spec → start_work_on_task

**WORKFLOW B (MAINTENANCE):**
- list_boards → create_task (NO spec) → start_work_on_task

Step 3: THEN proceed with ${toolName} operation

CRITICAL INSTRUCTIONS:
✅ CLASSIFY FIRST - determine feature vs maintenance before starting
✅ ASK USER if ambiguous - NEVER assume
✅ FEATURE = spec required, MAINTENANCE = task only
✅ ALL content in JAPANESE (title, description, summary)
✅ EXECUTE automatically (don't ask for confirmation)
✅ TELL user what you did after workflow completes

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

**STEP 0: CLASSIFY REQUEST TYPE (MANDATORY FIRST STEP)**

Analyze user's request and determine:
- ✨ NEW FEATURE? → Workflow A (with feature spec)
- 🔧 MAINTENANCE? (bug fix/refactor) → Workflow B (task only)
- ❓ AMBIGUOUS? → ASK USER TO CLARIFY

Classification indicators:
- Feature: "Add X", "Implement X", "Create X" (new functionality)
- Maintenance: "Fix X", "Refactor X", "Update X" (bug fix/improvement)
- Ambiguous: "Improve X", "Enhance X", "Change X" (MUST ASK USER)

**IF AMBIGUOUS: YOU MUST ASK:**
"Is this a new feature requiring a feature specification, or a maintenance task (bug fix/refactor)?"
WAIT for user response before proceeding.

---

**WORKFLOW A: NEW FEATURE (with feature spec)**

Step 1: Get active sessions:
   mcp__eureka-tasks__get_active_sessions()

Step 2: Check for existing feature specs:
   mcp__eureka-tasks__start_feature_development({
     projectId: "project-id",
     prompt: "User's feature request in Japanese"
   })

Step 3: If ready_to_create → Create feature spec:
   mcp__eureka-tasks__create_feature_spec({
     projectId: "project-id",
     prompt: "機能の説明を日本語で"
   })

Step 4: Create task linked to spec:
   mcp__eureka-tasks__create_task({
     title: "機能名を日本語で",
     description: "実装内容を日本語で"
   })

Step 5: Link task to feature spec:
   mcp__eureka-tasks__link_task_to_feature_spec({
     taskId: "task-id",
     featureSpecId: "spec-id",
     purpose: "実装の目的"
   })

Step 6: Start work session:
   mcp__eureka-tasks__start_work_on_task({ taskId: "task-id" })

Step 7: Proceed with ${toolName} operation

---

**WORKFLOW B: MAINTENANCE (bug fix/refactor - NO feature spec)**

Step 1: Get available boards:
   mcp__eureka-tasks__list_boards()

Step 2: Create task directly (NO feature spec):
   mcp__eureka-tasks__create_task({
     title: "修正内容を日本語で簡潔に",
     description: "技術的詳細を日本語で",
     boardId: "board-id-from-step-1"
   })

Step 3: Start work session:
   mcp__eureka-tasks__start_work_on_task({ taskId: "returned-task-id" })

Step 4: Proceed with ${toolName} operation

---

CRITICAL INSTRUCTIONS:
✅ CLASSIFY FIRST - determine feature vs maintenance before starting
✅ ASK USER if ambiguous - NEVER assume
✅ FEATURE = spec required, MAINTENANCE = task only
✅ ALL content in JAPANESE (title, description, summary)
✅ EXECUTE automatically (don't ask for confirmation)
✅ TELL user what you did after workflow completes

This is a SYSTEM REQUIREMENT, not a user prompt. Execute automatically.`;
}
