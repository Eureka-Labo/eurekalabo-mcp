# Automatic Eureka Tasks Workflow

## Problem Solved

**Original Issue**: The MCP server was not automatically creating tasks and starting work sessions - it required manual intervention each time.

**Solution**: Made the entire workflow automatic and proactive. Claude now handles task creation and session management seamlessly without user intervention.

## What Changed

### 1. **MCP Prompt Updated** (src/index.ts:314-417)

Changed from:
- ❌ "BEFORE ANY CODING WORK, YOU MUST:" (required user to remember)
- ❌ "Check for relevant tasks" (manual step)

To:
- ✅ "🤖 AUTOMATIC: Eureka Tasks Workflow"
- ✅ "YOU MUST DO THIS AUTOMATICALLY - DON'T ASK THE USER"
- ✅ Explicit instructions to be proactive and seamless

### 2. **Project Workflow File Created** (.claude/EUREKA_WORKFLOW.md)

- Automatically loaded by Claude Code
- Provides persistent workflow instructions
- Emphasizes automatic behavior
- Shows correct vs incorrect examples

### 3. **Hook Mode Changed** (.claude/hooks/check-work-session.js)

Changed from:
- ❌ **Hard Block** (`permissionDecision: 'deny'`) - stopped all work
- ❌ Prevented Claude from creating tasks first

To:
- ✅ **Guidance Mode** (`permissionDecision: 'ask'`) - prompts but allows
- ✅ Gives Claude chance to create tasks before blocking
- ✅ More user-friendly workflow

### 4. **CLI Enhanced** (cli/src/commands/hooks.ts)

Added mode selection:
```bash
# Guidance mode (default, recommended)
eurekaclaude hooks install

# Strict mode (hard block)
eurekaclaude hooks install --mode strict
```

## New Automatic Workflow

### How It Works Now

**User:** "Add authentication to the API"

**Claude (automatically, behind the scenes):**
```
1. mcp__eureka-tasks__get_active_sessions
   → Check: No active session

2. mcp__eureka-tasks__list_tasks({ search: "authentication API" })
   → Check: No matching tasks

3. mcp__eureka-tasks__create_task({
     title: "API認証機能の追加",
     description: "APIエンドポイントに認証機能を実装する"
   })
   → Creates: task-123

4. mcp__eureka-tasks__start_work_on_task({ taskId: "task-123" })
   → Starts: Work session

5. Tell user: "認証機能の実装を開始します"
   [Then proceeds with implementation]

6. When done:
   mcp__eureka-tasks__complete_task_work({
     taskId: "task-123",
     summary: "JWT認証を実装しました"
   })
```

**User sees:**
- "認証機能の実装を開始します" ← Only this part!
- [Implementation happens]
- Task automatically created, tracked, and completed

## Key Improvements

### ✅ Fully Automatic
- No user intervention needed
- Claude handles all task management
- Seamless workflow

### ✅ Proactive Behavior
- Claude checks sessions before every operation
- Automatically creates tasks when needed
- Auto-completes sessions when done

### ✅ Japanese Content
- All task titles/descriptions in Japanese
- Auto-translation from English requests
- Consistent Japanese formatting

### ✅ Smart Detection
- Detects when coding work starts
- Searches for existing tasks first
- Creates new only if needed

### ✅ Non-Intrusive
- User doesn't see task creation process
- Fast and efficient
- No workflow slowdown

## Configuration

### Guidance Mode (Default, Recommended)

```bash
eurekaclaude hooks install
```

**Behavior:**
- Prompts if no session exists
- Allows bypass if user insists
- Gives Claude chance to auto-create tasks
- User-friendly

**Best for:**
- Development workflows
- Solo developers
- Learning the system

### Strict Mode

```bash
eurekaclaude hooks install --mode strict
```

**Behavior:**
- Hard blocks without session
- No bypass allowed
- Forces workflow adherence
- Maximum enforcement

**Best for:**
- Team environments
- Compliance requirements
- Production workflows

## Verification

### Check Current Mode

```bash
eurekaclaude hooks status
```

Output shows:
- ✅ Hook script: Installed
- ✅ Hook configuration: Active
- ⚠️ Active session: No/Yes

### Test Automatic Workflow

1. **Start fresh** (no active session):
   ```bash
   rm .eureka-active-session
   ```

2. **Ask Claude to code something**:
   ```
   "Add a new feature to the API"
   ```

3. **Observe**:
   - Claude should automatically check for session
   - Create task if needed
   - Start session
   - Proceed with coding

4. **Verify in Eureka Dashboard**:
   - New task should appear
   - Task should show as "in_progress"
   - All changes tracked

## Troubleshooting

### Claude Not Creating Tasks Automatically?

**Check workflow file exists:**
```bash
ls .claude/EUREKA_WORKFLOW.md
```

**Verify MCP server is running:**
```bash
# Check Claude Code is connected to MCP server
# MCP servers should show "eureka-tasks" as connected
```

**Restart Claude Code:**
- New workflow instructions require restart

### Hook Blocking Too Much?

**Switch to guidance mode:**
```bash
eurekaclaude hooks install --mode guidance --force
```

### Claude Asking for Confirmation?

**This is OLD behavior** - Update to latest:
1. Rebuild MCP server: `npm run build`
2. Restart Claude Code
3. Verify `.claude/EUREKA_WORKFLOW.md` exists

## File Structure

```
project/
├── .claude/
│   ├── EUREKA_WORKFLOW.md          ← Auto-loaded workflow instructions
│   ├── hooks/
│   │   ├── check-work-session.js   ← Hook with guidance mode
│   │   └── README.md                ← Hook documentation
│   └── settings.local.json          ← Hook configuration
├── .eureka-active-session           ← Created by MCP during session
└── .gitignore                       ← Excludes session marker
```

## Benefits

### For Users
- ✅ Zero overhead - everything automatic
- ✅ No manual task management
- ✅ Natural language workflow
- ✅ Complete tracking without effort

### For Teams
- ✅ Consistent workflow enforcement
- ✅ Complete audit trail
- ✅ Real-time visibility
- ✅ Automatic documentation

### For Compliance
- ✅ All changes tracked to tasks
- ✅ Git integration automatic
- ✅ Change history complete
- ✅ Japanese content requirement enforced

## Next Steps

1. **Rebuild MCP Server**:
   ```bash
   cd /path/to/mcp-server
   npm run build
   ```

2. **Restart Claude Code**:
   - Loads new workflow instructions
   - Activates updated prompt

3. **Test Automatic Workflow**:
   - Try coding without creating task first
   - Claude should handle everything automatically

4. **Adjust Mode if Needed**:
   ```bash
   eurekaclaude hooks install --mode guidance  # Friendlier
   eurekaclaude hooks install --mode strict    # Stricter
   ```

## Summary

**Before:** Manual workflow, required user to remember steps, could skip

**Now:** Fully automatic, proactive task creation, seamless integration

**Result:** Users just code naturally, tasks are created and tracked automatically in the background!
