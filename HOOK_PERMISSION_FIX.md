# Hook Permission Decision Fix

## Problem Discovered

The hook was using `permissionDecision: "ask"` which caused the workflow NOT to be enforced:

### Claude Code Permission Behaviors

According to official docs:

| Permission | Behavior | Guidance Shown To |
|------------|----------|-------------------|
| **`allow`** | Bypass permission system | User only |
| **`ask`** | Request user confirmation | User only (NOT Claude) |
| **`deny`** | Block operation | **Claude (AI)** |

### Why "ask" Failed

1. ❌ Hook returned `permissionDecision: "ask"`
2. ❌ Guidance message shown to **user only**, not to Claude
3. ❌ Claude (AI) didn't see the instructions
4. ❌ Claude continued processing as normal
5. ❌ No automatic workflow triggered
6. ❌ Operations went through despite "hook error" message

### User Experience Was:
```
User: "Edit this file"
Hook: Shows "PreToolUse:Edit hook error"
Claude: Proceeds with edit (didn't see guidance)
Result: ❌ No task created, no session started
```

## Solution: Use "deny" Permission

Changed both guidance and strict modes to use `permissionDecision: "deny"`:

### New Behavior

1. ✅ Hook returns `permissionDecision: "deny"`
2. ✅ **Blocks the operation**
3. ✅ Guidance message shown to **Claude (AI)**
4. ✅ Claude sees automatic workflow instructions
5. ✅ Claude executes workflow automatically:
   - List existing tasks
   - Create task if needed
   - Start work session
   - Retry the operation
6. ✅ User sees: "タスク [title] を作成して作業を開始しました"

### New User Experience:
```
User: "Edit this file"
Hook: Blocks with guidance to Claude
Claude:
  1. Searches for existing tasks
  2. Creates task if none found
  3. Starts work session
  4. Tells user: "タスク [X] を作成して作業を開始しました"
  5. Proceeds with edit
Result: ✅ Complete audit trail automatically
```

## Files Modified

### 1. Current Hook Script
**File**: `.claude/hooks/check-work-session.cjs`
```javascript
// Before
permissionDecision: 'ask',  // ❌ Didn't work

// After
permissionDecision: 'deny',  // ✅ Works correctly
```

### 2. CLI Hook Template
**File**: `cli/src/commands/hooks.ts` (line 264)
```typescript
// Before
permissionDecision: '${mode === 'strict' ? 'deny' : 'ask'}',  // ❌ 'ask' mode broken

// After
permissionDecision: 'deny',  // ✅ Both modes use 'deny' for proper enforcement
```

## Mode Distinction Removed

Previously we had two modes:
- **Guidance mode**: `ask` (didn't work)
- **Strict mode**: `deny` (worked but seemed too harsh)

Now both modes use `deny` because:
- It's the only way to show guidance to Claude
- It's the only way to trigger automatic workflow
- The "automatic workflow" makes it feel gentle to users
- Complete enforcement ensures audit trail

### Updated CLI Behavior

```bash
eurekaclaude hooks install --mode guidance  # Uses 'deny'
eurekaclaude hooks install --mode strict    # Uses 'deny'
```

Both modes now provide the same enforcement with automatic workflow execution.

## Testing Results

### Before Fix (with "ask")

```bash
$ # Try to edit without session
Claude: Edits file directly
Hook: Shows error but doesn't block
Result: ❌ No task, no session, no audit trail
```

### After Fix (with "deny")

```bash
$ # Try to edit without session
Hook: Blocks with guidance
Claude:
  - mcp__eureka-tasks__list_tasks(...)
  - mcp__eureka-tasks__create_task(...)
  - mcp__eureka-tasks__start_work_on_task(...)
  - "タスク [X] を作成して作業を開始しました"
  - Proceeds with edit
Result: ✅ Complete workflow executed automatically
```

## Documentation Updates Needed

### 1. Update CLI Installation Guide
- Remove distinction between "guidance" and "strict" modes
- Explain that automatic workflow makes enforcement gentle
- Update mode descriptions

### 2. Update Hook README
- Explain "deny" permission behavior
- Clarify how automatic workflow is triggered
- Update troubleshooting section

### 3. Update Main README
- Explain seamless automatic workflow
- Emphasize zero manual intervention needed
- Highlight audit trail benefits

## Benefits of This Fix

1. **Actual Enforcement**: Operations are blocked until session exists
2. **Automatic Workflow**: Claude executes workflow without asking user
3. **Seamless UX**: User just requests edit, Claude handles the rest
4. **Complete Audit Trail**: Every code change tracked with task
5. **Team Visibility**: All work visible in Eureka Tasks dashboard
6. **Git Integration**: Automatic change tracking with baselines

## Breaking Changes

### For Existing Users

Users who installed hooks with old version need to reinstall:

```bash
# Update CLI
npm update -g eurekaclaude

# Reinstall hooks
eurekaclaude hooks install --force
```

This will:
- Replace old hook with "deny" permission
- Update CLI templates for future installations
- Maintain all other hook functionality

### Migration Notes

- Old hooks with "ask" permission: ❌ Won't enforce workflow
- New hooks with "deny" permission: ✅ Full enforcement
- No configuration changes needed
- Session marker format unchanged
- MCP server API unchanged

## Future Considerations

### Could We Use "ask" If It Worked Properly?

Even if "ask" showed guidance to Claude, "deny" is better because:
- More deterministic (always blocks)
- Clearer enforcement semantics
- No ambiguity about behavior
- Simpler mental model

### Should We Keep Two Modes?

Current implementation: Both modes use "deny"

Alternatives considered:
1. **Remove mode option entirely**: Simpler but less flexible
2. **"allow" for guidance mode**: Would bypass enforcement (bad)
3. **Keep current approach**: Both use "deny", good for all users

**Decision**: Keep both mode names for CLI compatibility but both use "deny" internally.

## Conclusion

The fix changes `permissionDecision` from "ask" to "deny" in both the current hook and CLI template. This ensures:

- ✅ Operations are actually blocked
- ✅ Claude receives guidance instructions
- ✅ Automatic workflow is triggered
- ✅ Complete audit trail maintained
- ✅ Seamless user experience

The hook now works as originally intended - enforcing the Eureka Tasks workflow while providing a smooth, automatic experience for users.
