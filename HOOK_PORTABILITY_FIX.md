# Hook Portability Fix

## Problem Identified

The `eurekaclaude hooks install` command was generating **absolute paths** in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit|NotebookEdit",
      "hooks": [{
        "type": "command",
        "command": "/Users/yujirohikawa/workspace/eurekalabo/mcp-server/.claude/hooks/check-work-session.cjs"
      }]
    }]
  }
}
```

### Issues with Absolute Paths:

1. ❌ **Not portable** - Breaks when moving project to different location
2. ❌ **Not shareable** - Different developers have different absolute paths
3. ❌ **Not cross-platform** - Windows vs Unix path differences
4. ❌ **Directory-specific** - Claude Code uses settings from current working directory

## Solution Implemented

### 1. Fixed CLI Code (`cli/src/commands/hooks.ts`)

Changed line 374-375 from:
```typescript
const hookPath = join(workspace, '.claude', 'hooks', 'check-work-session.cjs');
```

To:
```typescript
// Use relative path from workspace root for portability
const hookPath = '.claude/hooks/check-work-session.cjs';
```

### 2. Updated Existing Settings Files

Updated all three project directories to use relative paths:
- `/eurekalabo/mcp-server/.claude/settings.local.json` ✅
- `/eurekalabo/.claude/settings.local.json` ✅
- `/eurekalabo/eurekalabo/.claude/settings.local.json` ✅

### 3. Rebuilt CLI

```bash
npm run build
```

## Benefits

✅ **Portable** - Works anywhere the project is moved
✅ **Shareable** - Same configuration for all team members
✅ **Cross-platform** - Works on Windows, Mac, Linux
✅ **Version-controllable** - Can safely commit `.claude/settings.local.json`

## How It Works

Claude Code resolves relative paths from the **current working directory**:

```
Working Directory: /path/to/project/
Hook Config:       .claude/hooks/check-work-session.cjs
Resolved To:       /path/to/project/.claude/hooks/check-work-session.cjs
```

This means:
- Hook configuration is portable
- Claude Code handles absolute path resolution internally
- Works correctly regardless of where project is located

## Testing

Verified hook works with relative paths:

```bash
# Remove session marker
mv .eureka-active-session .eureka-active-session.backup

# Test hook blocking (should block)
# Write operation was correctly BLOCKED ✅

# Restore session
mv .eureka-active-session.backup .eureka-active-session
```

## For New Installations

Future `eurekaclaude hooks install` commands will automatically use relative paths.

## For Existing Installations

To update existing installations:

```bash
# Option 1: Reinstall (recommended)
eurekaclaude hooks install --force

# Option 2: Manual edit
# Change absolute paths to relative: .claude/hooks/check-work-session.cjs
```

## Related Files

- `cli/src/commands/hooks.ts` - CLI hook installation logic
- `.claude/settings.local.json` - Hook configuration (each directory)
- `.claude/hooks/check-work-session.cjs` - Hook script

---

**Fixed**: 2025-10-30
**Issue**: Absolute paths prevented hook portability
**Solution**: Use relative paths from workspace root
