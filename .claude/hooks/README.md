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

```bash
# Step 1: Search for existing tasks
mcp__eureka-tasks__list_tasks({ search: "認証" })

# Step 2: Create task if none exists (Japanese content)
mcp__eureka-tasks__create_task({
  title: "APIにJWT認証を追加",
  description: "認証ミドルウェアを実装し、全エンドポイントを保護する"
})

# Step 3: Start work session (REQUIRED before code changes)
mcp__eureka-tasks__start_work_on_task({ taskId: "task-123" })

# Step 4: Now Write/Edit operations are allowed
Write({ file_path: "src/auth.ts", content: "..." })

# Step 5: Complete work session (Japanese summary)
mcp__eureka-tasks__complete_task_work({
  taskId: "task-123",
  summary: "JWT認証ミドルウェアを実装しました"
})
```

## Benefits

- ✅ Complete audit trail for all code changes
- ✅ Automatic git integration and change tracking
- ✅ Team visibility via Eureka Tasks dashboard
- ✅ Enforced workflow (no accidental bypassing)

## Troubleshooting

### Hook not working?

```bash
# Check hook is executable
chmod +x .claude/hooks/check-work-session.js

# Verify configuration
cat .claude/settings.local.json | grep -A 10 "hooks"
```

### Session marker exists but no active session?

```bash
# Manually remove stale marker
rm .eureka-active-session
```

## Management Commands

```bash
# Install hook
eurekaclaude hooks install

# Check status
eurekaclaude hooks status

# Uninstall hook
eurekaclaude hooks uninstall
```
