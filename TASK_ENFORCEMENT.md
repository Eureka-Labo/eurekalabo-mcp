# Task Enforcement Mode

## Overview

The Eureka Tasks MCP server includes a **task-enforcement prompt** that guides Claude to require task creation before any coding work. This ensures all code changes are tracked and linked to tasks.

## How It Works

When the enforcement prompt is active, Claude will:

1. **Always check** for existing tasks before coding
2. **Require task creation** if no relevant task exists
3. **Start work session** before any file modifications
4. **Track all changes** through git integration
5. **Complete work session** when done

## Activation Methods

### Method 1: Claude Code MCP Configuration

Add the prompt to your `.mcp.json`:

```json
{
  "mcpServers": {
    "eureka-tasks": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/build/index.js"],
      "env": {
        "EUREKA_API_KEY": "your-api-key",
        "EUREKA_API_URL": "https://your-instance.com",
        "WORKSPACE_PATH": "/path/to/workspace"
      },
      "autoApprove": [
        "list_tasks",
        "get_task",
        "create_task",
        "get_active_sessions"
      ],
      "prompts": ["task-enforcement"]
    }
  }
}
```

### Method 2: Manual Invocation

At the start of each coding session, invoke the prompt:

```
/prompt task-enforcement
```

### Method 3: Global CLAUDE.md Rule

Add to your `~/.claude/CLAUDE.md`:

```markdown
# Task Enforcement Rule

**🔴 CRITICAL: Before ANY coding work:**

1. Check `mcp__eureka-tasks__list_tasks` for relevant tasks
2. If no task exists: Call `mcp__eureka-tasks__create_task` (MANDATORY)
3. Call `mcp__eureka-tasks__start_work_on_task` before any Write/Edit
4. Do the coding work
5. Call `mcp__eureka-tasks__complete_task_work` when done

**This applies to ALL projects with Eureka Tasks MCP enabled.**
```

## Enforcement Levels

### 🟢 Soft Enforcement (Prompt Only)
- Guides Claude's behavior through prompts
- Claude may skip in edge cases
- User can override

### 🟡 Medium Enforcement (Global Rule + Prompt)
- Combines MCP prompt with CLAUDE.md rule
- Stronger behavioral guidance
- Consistent across sessions

### 🔴 Hard Enforcement (Future: Interceptor)
- Programmatic blocking of Write/Edit without active session
- Requires custom Claude Code extension
- Not yet implemented

## Workflow Example

```
User: "Add a login form to the dashboard"

Claude Response:
"Let me first check for relevant tasks and create one if needed."

1. mcp__eureka-tasks__list_tasks(search: "login")
   → No matching tasks

2. mcp__eureka-tasks__create_task({
     title: "Add login form to dashboard",
     description: "Create React component with email/password fields"
   })
   → taskId: "task-abc123"

3. mcp__eureka-tasks__start_work_on_task(taskId: "task-abc123")
   → Work session started, git baseline captured

4. [Creates/edits files for login form]

5. mcp__eureka-tasks__complete_task_work(
     taskId: "task-abc123",
     summary: "Implemented login form component with validation"
   )
   → All changes logged to task
```

## Benefits

✅ **Complete Audit Trail**: Every code change linked to a task
✅ **Git Integration**: Automatic change tracking from baseline
✅ **Team Visibility**: All work visible in Eureka dashboard
✅ **Change History**: Full context of what, why, and when
✅ **PR Automation**: `create_pull_request` uses task history

## Current Limitations

- Cannot block native Claude Code tools (Write/Edit) at MCP level
- Relies on Claude following prompt guidance
- User can still manually override

## Future Enhancements

- **Interceptor Hook**: Block Write/Edit without active session
- **Session Status Resource**: Real-time session state checking
- **Automatic Task Inference**: AI-generated task titles from user prompts
- **Multi-Task Sessions**: Support multiple related tasks in one session
