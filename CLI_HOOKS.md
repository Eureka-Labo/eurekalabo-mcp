# EurekaClaude CLI - Hooks Management

## Overview

The EurekaClaude CLI provides commands to easily set up and manage work session enforcement hooks for your project. Instead of manually configuring hooks, you can use simple CLI commands to install, check status, and uninstall hooks.

## Installation

### Install the CLI globally (recommended)

```bash
cd /Users/yujirohikawa/workspace/eurekalabo/mcp-server/cli
npm install -g .
```

After global installation, you can use `eurekaclaude` from anywhere.

### Or use directly without installation

```bash
node /path/to/mcp-server/cli/dist/index.js hooks [command]
```

## Commands

### `eurekaclaude hooks install`

Install the work session enforcement hook in your current project.

**Usage:**
```bash
eurekaclaude hooks install [options]
```

**Options:**
- `-f, --force` - Force overwrite if hook already exists
- `-w, --workspace <path>` - Specify workspace path (default: current directory)

**What it does:**
1. Creates `.claude/hooks/check-work-session.js` script
2. Configures hook in `.claude/settings.local.json`
3. Updates `.gitignore` to exclude session marker file
4. Creates documentation in `.claude/hooks/README.md`

**Example:**
```bash
# Install in current directory
eurekaclaude hooks install

# Install in specific directory
eurekaclaude hooks install --workspace /path/to/project

# Force reinstall
eurekaclaude hooks install --force
```

### `eurekaclaude hooks status`

Check the installation status of work session hooks.

**Usage:**
```bash
eurekaclaude hooks status [options]
```

**Options:**
- `-w, --workspace <path>` - Specify workspace path (default: current directory)

**Example output:**
```
🪝 Eureka Tasks Hook Status

✅ Hook script: Installed
   /path/to/.claude/hooks/check-work-session.js
✅ Hook configuration: Active
✅ Active session: Yes
   Task: task-123
   Started: 2025-10-29 18:30:00
   Branch: feature/auth
```

**Example:**
```bash
# Check status in current directory
eurekaclaude hooks status

# Check status in specific directory
eurekaclaude hooks status --workspace /path/to/project
```

### `eurekaclaude hooks uninstall`

Remove the work session enforcement hook configuration.

**Usage:**
```bash
eurekaclaude hooks uninstall [options]
```

**Options:**
- `-w, --workspace <path>` - Specify workspace path (default: current directory)

**What it does:**
1. Removes hooks configuration from `.claude/settings.local.json`
2. Hook script file remains (can be manually deleted if needed)

**Example:**
```bash
# Uninstall from current directory
eurekaclaude hooks uninstall

# Uninstall from specific directory
eurekaclaude hooks uninstall --workspace /path/to/project
```

## Complete Setup Workflow

### 1. Initialize EurekaClaude Framework

First, set up the complete framework:

```bash
cd /path/to/your/project
eurekaclaude init
```

This will:
- Install Eureka Tasks MCP server
- Set up framework files
- Configure slash commands
- **Ask if you want to install hooks** (you can also do this manually later)

### 2. Or Just Install Hooks

If you only want the hooks feature:

```bash
cd /path/to/your/project
eurekaclaude hooks install
```

### 3. Verify Installation

```bash
eurekaclaude hooks status
```

You should see:
- ✅ Hook script: Installed
- ✅ Hook configuration: Active

### 4. Start Using

Now when you try to Write or Edit files without an active session, you'll be blocked with guidance:

```
🚫 Eureka Tasks作業セッションが必要です

操作をブロックしました: Write on src/auth.ts

**必須の手順:**
1. mcp__eureka-tasks__list_boards でボードを取得
2. mcp__eureka-tasks__list_tasks で関連タスクを検索
3. mcp__eureka-tasks__create_task (タスクがない場合、boardId付き)
4. mcp__eureka-tasks__start_work_on_task (必須)
5. Write/Edit操作が許可されます
6. mcp__eureka-tasks__complete_task_work (完了時)
```

## Required Workflow (Enforced by Hook)

The hook enforces this workflow:

```bash
# Step 1: Get available boards
mcp__eureka-tasks__list_boards()
# Returns: [{ id: "board-123", name: "API Development", ... }]

# Step 2: Check for existing tasks
mcp__eureka-tasks__list_tasks({ search: "認証" })

# Step 3: Create task if none exists (REQUIRED with board assignment)
mcp__eureka-tasks__create_task({
  title: "APIにJWT認証を追加",  # Japanese required
  description: "認証ミドルウェアを実装",  # Japanese required
  boardId: "board-123"  # Board assignment required
})
# Returns: { taskId: "task-123" }

# Step 4: Start work session (REQUIRED before coding)
mcp__eureka-tasks__start_work_on_task({ taskId: "task-123" })
# Creates .eureka-active-session marker

# Step 5: Now Write/Edit operations are allowed ✅
Write({ file_path: "src/auth.ts", content: "..." })
Edit({ file_path: "src/routes.ts", old_string: "...", new_string: "..." })

# Step 6: Complete work session (REQUIRED at end)
mcp__eureka-tasks__complete_task_work({
  taskId: "task-123",
  summary: "JWT認証を実装しました"  # Japanese required
})
# Deletes .eureka-active-session marker
# Captures all git changes and logs to task
```

## Troubleshooting

### Hook not blocking operations?

1. **Check hook is executable:**
   ```bash
   chmod +x .claude/hooks/check-work-session.js
   ```

2. **Verify settings:**
   ```bash
   cat .claude/settings.local.json | grep -A 10 "hooks"
   ```

3. **Restart Claude Code:**
   Settings changes require Claude Code restart

### Stale session marker?

If MCP server restarted and marker file remains:

```bash
# Manually remove
rm .eureka-active-session

# Then start fresh session
mcp__eureka-tasks__start_work_on_task({ taskId: "task-xxx" })
```

### CLI command not found?

If `eurekaclaude` command not found after global install:

```bash
# Check npm global bin path
npm config get prefix

# Add to PATH if needed (add to ~/.zshrc or ~/.bashrc)
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Want to temporarily disable hook?

```bash
# Uninstall hook configuration
eurekaclaude hooks uninstall

# Work without enforcement

# Reinstall when ready
eurekaclaude hooks install
```

## Files Created

When you install hooks, these files are created:

```
project/
├── .claude/
│   ├── hooks/
│   │   ├── check-work-session.js    # Hook validation script
│   │   └── README.md                 # Hook documentation
│   └── settings.local.json           # Updated with hook config
├── .gitignore                        # Updated with session marker
└── .eureka-active-session            # Created on session start (gitignored)
```

## Benefits

### ✅ Complete Audit Trail
- Every code change linked to a task
- Git baseline captured automatically
- Full diff stored in database
- Change history in Eureka Tasks dashboard

### ✅ Team Visibility
- All work visible in dashboard
- Real-time status updates
- Task-based collaboration
- Automatic PR creation

### ✅ Enforced Workflow
- No way to bypass accidentally
- Consistent process across team
- All changes tracked
- Japanese content requirement
- Automatic board assignment

### ✅ Git Integration
- Automatic baseline capture
- Complete diff tracking
- No manual git operations
- Works with any git workflow

## Advanced Usage

### Multiple Projects

Install hooks in each project independently:

```bash
# Project 1
cd /path/to/project1
eurekaclaude hooks install

# Project 2
cd /path/to/project2
eurekaclaude hooks install
```

### CI/CD Integration

The hook works locally only (PreToolUse hook). For CI/CD:

```yaml
# .github/workflows/eureka-tasks.yml
name: Eureka Tasks Sync
on: [push, pull_request]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Sync with Eureka Tasks
        env:
          EUREKA_API_KEY: ${{ secrets.EUREKA_API_KEY }}
          EUREKA_API_URL: ${{ secrets.EUREKA_API_URL }}
        run: |
          # Your sync logic here
```

### Custom Workspace Structure

If your project has multiple workspaces:

```bash
# Install in monorepo root
eurekaclaude hooks install --workspace /path/to/monorepo

# Or in each package
eurekaclaude hooks install --workspace /path/to/monorepo/packages/api
eurekaclaude hooks install --workspace /path/to/monorepo/packages/web
```

## API Reference

### Hook Script Interface

The hook script receives stdin JSON:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  }
}
```

And returns stdout JSON:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny",
    "permissionDecisionReason": "Message shown to Claude/user"
  },
  "suppressOutput": false
}
```

## Support

For issues or questions:

1. Check hook status: `eurekaclaude hooks status`
2. Review documentation: `.claude/hooks/README.md`
3. Check MCP server logs for errors
4. Verify git repository is initialized
5. Open an issue on GitHub

## Related Documentation

- [EurekaClaude Framework Guide](./EUREKACLAUDE_FRAMEWORK.md)
- [Eureka Tasks MCP Server](./README.md)
- [Claude Code Hooks Documentation](https://docs.claude.com/en/docs/claude-code/hooks.md)
