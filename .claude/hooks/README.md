# Eureka Tasks Work Session Hook

## Overview

This PreToolUse hook enforces the Eureka Tasks workflow by ensuring that all code modifications (Write/Edit operations) happen within an active work session.

## How It Works

### Session Marker File

When you start a work session with `start_work_on_task`, the MCP server creates a marker file:

```
.eureka-active-session
```

### Hook Validation

Before every Write or Edit operation, the hook:
1. Checks if `.eureka-active-session` exists
2. **If NO session**: Blocks the operation with detailed guidance
3. **If session exists**: Allows operation and shows current task info

## Required Workflow

### Step 0: Classification (Automatic)

**IMPORTANT**: The hook will first guide you to classify your request:

- **✨ New Feature**: Requires feature specification + task
- **🔧 Maintenance**: Bug fix/refactor - task only, no spec
- **❓ Ambiguous**: Hook will prompt you to clarify

See [WORKFLOW_CLASSIFICATION.md](../../docs/WORKFLOW_CLASSIFICATION.md) for details.

### Workflow A: New Feature (with Feature Spec)

```bash
# Step 1: Check for existing feature specs
mcp__eureka-tasks__start_feature_development({
  projectId: "project-id",
  prompt: "API認証機能の追加"
})

# Step 2: Create feature spec (if needed)
mcp__eureka-tasks__create_feature_spec({
  projectId: "project-id",
  prompt: "JWT認証システムの実装"
})

# Step 3: Create task linked to spec
mcp__eureka-tasks__create_task({
  title: "JWT認証の実装",
  description: "認証ミドルウェアとエンドポイント保護"
})

# Step 4: Link task to feature spec
mcp__eureka-tasks__link_task_to_feature_spec({
  taskId: "task-123",
  featureSpecId: "spec-456",
  purpose: "認証ミドルウェアの実装"
})

# Step 5: Start work session
mcp__eureka-tasks__start_work_on_task({ taskId: "task-123" })

# Step 6: Write/Edit operations now allowed
Write({ file_path: "src/auth.ts", content: "..." })

# Step 7: Complete work session
mcp__eureka-tasks__complete_task_work({
  taskId: "task-123",
  summary: "JWT認証ミドルウェアを実装しました"
})
```

### Workflow B: Maintenance (Bug Fix/Refactor - No Feature Spec)

```bash
# Step 1: Get available boards
mcp__eureka-tasks__list_boards()

# Step 2: Create task directly (NO feature spec)
mcp__eureka-tasks__create_task({
  title: "ログインバグの修正",
  description: "500エラーの原因を特定して修正",
  boardId: "board-abc123"
})

# Step 3: Start work session
mcp__eureka-tasks__start_work_on_task({ taskId: "task-123" })

# Step 4: Write/Edit operations now allowed
Write({ file_path: "src/auth.ts", content: "..." })

# Step 5: Complete work session
mcp__eureka-tasks__complete_task_work({
  taskId: "task-123",
  summary: "認証エラーハンドリングを修正しました"
})
```

## Benefits

- ✅ Complete audit trail for all code changes
- ✅ Automatic git integration and change tracking
- ✅ Team visibility via Eureka Tasks dashboard
- ✅ Enforced workflow (no accidental bypassing)
- ✅ Automatic board assignment for task organization

## Troubleshooting

### Hook not working?

```bash
# Check hook is executable
chmod +x .claude/hooks/check-work-session.cjs

# Verify configuration
cat .claude/settings.local.json | grep -A 10 "hooks"
```

### Session marker exists but no active session?

The hook now automatically detects stale sessions from different Claude Code sessions and prompts you to create a new session automatically.

If you need to manually clean up:

```bash
# Manually remove stale marker
rm .eureka-active-session
```

### How Session Validation Works

1. **Session ID Tracking**: When you use Claude Code, a `UserPromptSubmit` hook stores the Claude Code session ID to `.claude-session-id`
2. **Session Creation**: When you start a work session, the MCP server reads the Claude session ID and stores it in the session marker
3. **Session Validation**: The `PreToolUse` hook compares the current Claude session ID with the one stored in the session marker
4. **Stale Detection**: If they don't match, the hook blocks the operation and guides you to create a new session

This prevents issues where:
- Old session markers from previous Claude Code sessions remain
- Tasks that no longer exist still have active markers
- Multiple Claude Code sessions interfere with each other

## Management Commands

```bash
# Install hook
eurekaclaude hooks install

# Check status
eurekaclaude hooks status

# Uninstall hook
eurekaclaude hooks uninstall
```
