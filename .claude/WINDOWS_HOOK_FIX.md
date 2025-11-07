# Windows Hook Configuration Fix

## Problem

On Windows, Claude Code hooks fail because:
1. **Absolute Unix paths** don't work on Windows
2. **Shebang (`#!/usr/bin/env node`)** not recognized by Windows
3. **File permissions** (chmod +x) don't apply

## Solution Options

### Option 1: Use Node Explicitly (Recommended) ✅

Modify `.claude/settings.local.json` to invoke hooks with `node` command:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/store-session-id.cjs",
            "timeout": 2
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/check-work-session.cjs",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Key Changes**:
- ❌ **Before**: `/Users/yujirohikawa/.../check-work-session.cjs`
- ✅ **After**: `node .claude/hooks/check-work-session.cjs`

**Why This Works**:
- Uses **relative path** (works on all platforms)
- Explicitly calls **node** (works on Windows)
- No shebang needed

### Option 2: Platform-Specific Wrapper Scripts

Create Windows batch file wrappers:

**`.claude/hooks/check-work-session.cmd`**:
```batch
@echo off
node "%~dp0check-work-session.cjs" %*
```

**`.claude/hooks/store-session-id.cmd`**:
```batch
@echo off
node "%~dp0store-session-id.cjs" %*
```

Then use `.cmd` files in settings:
```json
{
  "hooks": {
    "PreToolUse": [{
      "hooks": [{
        "command": ".claude/hooks/check-work-session.cmd"
      }]
    }]
  }
}
```

### Option 3: PowerShell Wrappers (If cmd doesn't work)

**`.claude/hooks/check-work-session.ps1`**:
```powershell
#!/usr/bin/env pwsh
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node "$scriptDir/check-work-session.cjs"
```

## Quick Fix Instructions

### Step 1: Update settings.local.json

Replace the `hooks` section with:

```json
{
  "permissions": {
    "allow": [
      // ... keep existing permissions ...
    ]
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["eureka-tasks"],
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/store-session-id.cjs",
            "timeout": 2
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/check-work-session.cjs",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Step 2: Test Hook Execution

Run this in PowerShell/CMD to verify hooks work:

```powershell
# Test check-work-session hook
echo '{"tool_name":"Write","tool_input":{"file_path":"test.ts"},"cwd":"C:\\path\\to\\project","session_id":"test"}' | node .claude/hooks/check-work-session.cjs
```

**Expected Output** (if no session):
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "🚨 NO ACTIVE WORK SESSION DETECTED..."
  }
}
```

### Step 3: Restart Claude Code

After updating settings:
1. Close Claude Code / VS Code
2. Reopen your project
3. Try a Write/Edit operation

## Alternative: Disable Hooks Temporarily

If hooks continue causing issues on Windows, disable them temporarily:

**`.claude/settings.local.json`**:
```json
{
  "permissions": { "allow": [...] },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["eureka-tasks"]
  // Remove or comment out "hooks" section
}
```

**Note**: This disables enforcement, so you'll need to manually:
1. Create tasks before coding
2. Start work sessions manually

## Verifying Fix Worked

### Test 1: Hook Status
```bash
eurekaclaude hooks status
```

Should show:
```
✅ Hook script: Installed
✅ Hook configuration: Active
```

### Test 2: Try Write Operation

In Claude Code, try:
```
"Create a new file test.ts"
```

**Expected**: Hook should trigger and ask for work session

### Test 3: Check Hook Execution Manually

```powershell
# PowerShell
$input = '{"tool_name":"Write","tool_input":{"file_path":"test.ts"},"cwd":"' + (Get-Location).Path + '","session_id":"test"}'
$input | node .claude/hooks/check-work-session.cjs
```

## Common Windows Errors

### Error 1: "node: command not found"
**Solution**: Ensure Node.js is in PATH
```powershell
node --version  # Should show version
```

### Error 2: "Cannot find module"
**Solution**: Ensure .cjs files exist
```powershell
dir .claude\hooks\*.cjs
```

### Error 3: "Access Denied"
**Solution**: Run VS Code as Administrator (temporarily)

### Error 4: "Timeout exceeded"
**Solution**: Increase timeout in settings
```json
{
  "timeout": 10  // Increase from 5 to 10 seconds
}
```

## Platform Detection in CLI

The CLI should auto-detect Windows and use appropriate paths. If not, you can force Windows mode:

```bash
eurekaclaude hooks install --platform windows
```

## Reporting Issues

If hooks still fail on Windows:

1. **Capture error message**
2. **Check Node.js version**: `node --version`
3. **Verify paths**:
   ```powershell
   Test-Path .claude\hooks\check-work-session.cjs
   ```
4. **Test manual execution**:
   ```powershell
   node .claude\hooks\check-work-session.cjs
   ```
5. **Report with details** to: https://github.com/eurekalabo/mcp-server/issues

## Long-term Fix

We should update the CLI to:
1. **Auto-detect OS** and use appropriate paths
2. **Use relative paths** by default (cross-platform)
3. **Prefix with `node`** command on Windows
4. **Test on Windows** in CI/CD

**Pull Request Welcome**: Fix in `cli/src/commands/hooks.ts:520-524`
